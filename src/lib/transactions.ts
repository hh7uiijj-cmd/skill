import {
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { accountDocRef, categoryDocRef, transactionDocRef, transactionsCol } from './paths';
import type { Transaction, TransactionType, Cents } from '../types/models';
import { isValidAmountCents } from './money';

export interface TransactionInput {
  type: TransactionType;
  amountCents: Cents;
  currency: string;
  date: Date;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  note: string;
  receiptUrl?: string | null;
}

export interface TransactionFilters {
  /** ช่วงวันที่ (รวมขอบเขต) */
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  accountId?: string;
}

function validateInput(input: TransactionInput) {
  if (!isValidAmountCents(input.amountCents)) {
    throw new Error('จำนวนเงินต้องมากกว่า 0');
  }
  if (!input.date || Number.isNaN(input.date.getTime())) {
    throw new Error('วันที่ไม่ถูกต้อง');
  }
  if (!input.accountId) {
    throw new Error('กรุณาเลือกบัญชี');
  }
  if (input.type === 'transfer') {
    if (!input.toAccountId) throw new Error('กรุณาเลือกบัญชีปลายทาง');
    if (input.toAccountId === input.accountId) {
      throw new Error('บัญชีต้นทางและปลายทางต้องไม่ใช่บัญชีเดียวกัน');
    }
  } else {
    if (!input.categoryId) throw new Error('กรุณาเลือกหมวดหมู่');
  }
}

/** คำนวณผลกระทบต่อยอดคงเหลือแต่ละบัญชี (หน่วยสตางค์) จากธุรกรรมหนึ่งรายการ */
function computeEffects(t: Pick<Transaction, 'type' | 'amountCents' | 'accountId' | 'toAccountId'>) {
  const effects = new Map<string, number>();
  const add = (accountId: string, delta: number) =>
    effects.set(accountId, (effects.get(accountId) ?? 0) + delta);

  if (t.type === 'income') add(t.accountId, t.amountCents);
  else if (t.type === 'expense') add(t.accountId, -t.amountCents);
  else if (t.type === 'transfer') {
    add(t.accountId, -t.amountCents);
    if (t.toAccountId) add(t.toAccountId, t.amountCents);
  }
  return effects;
}

function mergeEffects(...maps: Map<string, number>[]) {
  const merged = new Map<string, number>();
  for (const m of maps) {
    for (const [accountId, delta] of m) {
      merged.set(accountId, (merged.get(accountId) ?? 0) + delta);
    }
  }
  return merged;
}

function negate(map: Map<string, number>) {
  const negated = new Map<string, number>();
  for (const [k, v] of map) negated.set(k, -v);
  return negated;
}

/** สร้างธุรกรรมใหม่ และอัปเดตยอดคงเหลือบัญชีที่เกี่ยวข้องแบบอะตอมมิกใน Firestore transaction เดียวกัน */
export async function createTransaction(uid: string, input: TransactionInput) {
  validateInput(input);

  const newDocRef = doc(transactionsCol(uid));
  const effects = computeEffects(input);
  const accountIds = [...effects.keys()];

  await runTransaction(db, async (tx) => {
    // ต้องอ่านทุกอย่างก่อนเขียนตามข้อกำหนดของ Firestore transaction
    if (input.type !== 'transfer' && input.categoryId) {
      const categorySnap = await tx.get(categoryDocRef(uid, input.categoryId));
      if (!categorySnap.exists()) throw new Error('ไม่พบหมวดหมู่ที่เลือก');
      if (categorySnap.data().type !== input.type) {
        throw new Error('ประเภทหมวดหมู่ไม่ตรงกับประเภทธุรกรรม');
      }
    }

    const accountSnaps = await Promise.all(
      accountIds.map((id) => tx.get(accountDocRef(uid, id)))
    );
    accountSnaps.forEach((snap, i) => {
      if (!snap.exists()) throw new Error('ไม่พบบัญชีที่เลือก');
      void i;
    });

    tx.set(newDocRef, {
      userId: uid,
      type: input.type,
      amountCents: input.amountCents,
      currency: input.currency,
      date: Timestamp.fromDate(input.date),
      accountId: input.accountId,
      toAccountId: input.type === 'transfer' ? input.toAccountId : null,
      categoryId: input.type === 'transfer' ? null : input.categoryId,
      note: input.note.trim(),
      receiptUrl: input.receiptUrl ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
    });

    accountSnaps.forEach((snap, i) => {
      const accountId = accountIds[i];
      const delta = effects.get(accountId) ?? 0;
      tx.update(accountDocRef(uid, accountId), {
        currentBalanceCents: (snap.data()!.currentBalanceCents as number) + delta,
        updatedAt: serverTimestamp(),
      });
    });
  });

  return newDocRef.id;
}

export async function updateTransaction(
  uid: string,
  transactionId: string,
  input: TransactionInput
) {
  validateInput(input);
  const ref = transactionDocRef(uid, transactionId);

  await runTransaction(db, async (tx) => {
    const existingSnap = await tx.get(ref);
    if (!existingSnap.exists()) throw new Error('ไม่พบธุรกรรมนี้');
    const existing = existingSnap.data() as Transaction;

    if (input.type !== 'transfer' && input.categoryId) {
      const categorySnap = await tx.get(categoryDocRef(uid, input.categoryId));
      if (!categorySnap.exists()) throw new Error('ไม่พบหมวดหมู่ที่เลือก');
      if (categorySnap.data().type !== input.type) {
        throw new Error('ประเภทหมวดหมู่ไม่ตรงกับประเภทธุรกรรม');
      }
    }

    const oldEffects = existing.deletedAt ? new Map<string, number>() : computeEffects(existing);
    const newEffects = computeEffects(input);
    const netEffects = mergeEffects(negate(oldEffects), newEffects);
    const accountIds = [...netEffects.keys()];

    const accountSnaps = await Promise.all(
      accountIds.map((id) => tx.get(accountDocRef(uid, id)))
    );
    accountSnaps.forEach((snap) => {
      if (!snap.exists()) throw new Error('ไม่พบบัญชีที่เลือก');
    });

    tx.update(ref, {
      type: input.type,
      amountCents: input.amountCents,
      currency: input.currency,
      date: Timestamp.fromDate(input.date),
      accountId: input.accountId,
      toAccountId: input.type === 'transfer' ? input.toAccountId : null,
      categoryId: input.type === 'transfer' ? null : input.categoryId,
      note: input.note.trim(),
      receiptUrl: input.receiptUrl ?? null,
      updatedAt: serverTimestamp(),
    });

    accountSnaps.forEach((snap, i) => {
      const accountId = accountIds[i];
      const delta = netEffects.get(accountId) ?? 0;
      if (delta === 0) return;
      tx.update(accountDocRef(uid, accountId), {
        currentBalanceCents: (snap.data()!.currentBalanceCents as number) + delta,
        updatedAt: serverTimestamp(),
      });
    });
  });
}

/** Soft delete: ตั้งค่า deletedAt แทนการลบจริง เพื่อให้กู้คืนได้และเก็บประวัติ พร้อมย้อนผลกระทบยอดคงเหลือ */
export async function softDeleteTransaction(uid: string, transactionId: string) {
  const ref = transactionDocRef(uid, transactionId);
  await runTransaction(db, async (tx) => {
    const existingSnap = await tx.get(ref);
    if (!existingSnap.exists()) throw new Error('ไม่พบธุรกรรมนี้');
    const existing = existingSnap.data() as Transaction;
    if (existing.deletedAt) return; // ลบไปแล้ว ไม่ต้องทำซ้ำ

    const reversal = negate(computeEffects(existing));
    const accountIds = [...reversal.keys()];
    const accountSnaps = await Promise.all(
      accountIds.map((id) => tx.get(accountDocRef(uid, id)))
    );

    tx.update(ref, { deletedAt: serverTimestamp(), updatedAt: serverTimestamp() });

    accountSnaps.forEach((snap, i) => {
      if (!snap.exists()) return;
      const accountId = accountIds[i];
      const delta = reversal.get(accountId) ?? 0;
      tx.update(accountDocRef(uid, accountId), {
        currentBalanceCents: (snap.data()!.currentBalanceCents as number) + delta,
        updatedAt: serverTimestamp(),
      });
    });
  });
}

/** กู้คืนธุรกรรมที่ลบแบบ soft delete และนำผลกระทบยอดคงเหลือกลับมาใช้ใหม่ */
export async function restoreTransaction(uid: string, transactionId: string) {
  const ref = transactionDocRef(uid, transactionId);
  await runTransaction(db, async (tx) => {
    const existingSnap = await tx.get(ref);
    if (!existingSnap.exists()) throw new Error('ไม่พบธุรกรรมนี้');
    const existing = existingSnap.data() as Transaction;
    if (!existing.deletedAt) return;

    const effects = computeEffects(existing);
    const accountIds = [...effects.keys()];
    const accountSnaps = await Promise.all(
      accountIds.map((id) => tx.get(accountDocRef(uid, id)))
    );

    tx.update(ref, { deletedAt: null, updatedAt: serverTimestamp() });

    accountSnaps.forEach((snap, i) => {
      if (!snap.exists()) return;
      const accountId = accountIds[i];
      const delta = effects.get(accountId) ?? 0;
      tx.update(accountDocRef(uid, accountId), {
        currentBalanceCents: (snap.data()!.currentBalanceCents as number) + delta,
        updatedAt: serverTimestamp(),
      });
    });
  });
}

function buildFilterConstraints(filters: TransactionFilters): QueryConstraint[] {
  const constraints: QueryConstraint[] = [where('deletedAt', '==', null)];
  if (filters.startDate) constraints.push(where('date', '>=', Timestamp.fromDate(filters.startDate)));
  if (filters.endDate) constraints.push(where('date', '<=', Timestamp.fromDate(filters.endDate)));
  if (filters.categoryId) constraints.push(where('categoryId', '==', filters.categoryId));
  if (filters.accountId) constraints.push(where('accountId', '==', filters.accountId));
  return constraints;
}

/** ดึงธุรกรรมครั้งเดียว (ไม่ subscribe real-time) ใช้สำหรับ export รายงาน */
export async function fetchTransactionsOnce(
  uid: string,
  filters: TransactionFilters
): Promise<Transaction[]> {
  const constraints = [...buildFilterConstraints(filters), orderBy('date', 'desc')];
  const snap = await getDocs(query(transactionsCol(uid), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction);
}

export function subscribeTransactions(
  uid: string,
  filters: TransactionFilters,
  onChange: (transactions: Transaction[]) => void,
  onError?: (err: Error) => void
) {
  const constraints = [...buildFilterConstraints(filters), orderBy('date', 'desc')];
  const q = query(transactionsCol(uid), ...constraints);
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction)),
    onError
  );
}
