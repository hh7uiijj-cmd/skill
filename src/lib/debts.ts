import {
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { accountDocRef, categoryDocRef, debtDocRef, debtsCol, transactionsCol } from './paths';
import type { Cents, Debt } from '../types/models';
import { isValidAmountCents } from './money';

export interface DebtInput {
  name: string;
  amountCents: Cents;
  dueDate: Date;
  categoryId: string;
  accountId: string;
  note: string;
}

function validateDebtInput(input: DebtInput) {
  if (!input.name.trim()) throw new Error('กรุณาระบุชื่อรายการหนี้');
  if (!isValidAmountCents(input.amountCents)) throw new Error('จำนวนเงินต้องมากกว่า 0');
  if (!input.categoryId) throw new Error('กรุณาเลือกหมวดหมู่');
  if (!input.accountId) throw new Error('กรุณาเลือกบัญชีที่จะจ่าย');
}

export function subscribeDebts(
  uid: string,
  onChange: (debts: Debt[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(debtsCol(uid), orderBy('dueDate', 'asc'));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Debt)),
    onError
  );
}

export async function createDebt(uid: string, input: DebtInput) {
  validateDebtInput(input);
  await addDoc(debtsCol(uid), {
    userId: uid,
    name: input.name.trim(),
    amountCents: input.amountCents,
    dueDate: Timestamp.fromDate(input.dueDate),
    categoryId: input.categoryId,
    accountId: input.accountId,
    status: 'pending',
    note: input.note.trim(),
    paidTransactionId: null,
    paidAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateDebt(uid: string, debtId: string, input: DebtInput) {
  validateDebtInput(input);
  await updateDoc(debtDocRef(uid, debtId), {
    name: input.name.trim(),
    amountCents: input.amountCents,
    dueDate: Timestamp.fromDate(input.dueDate),
    categoryId: input.categoryId,
    accountId: input.accountId,
    note: input.note.trim(),
    updatedAt: serverTimestamp(),
  });
}

/** ลบรายการหนี้ ถ้าจ่ายไปแล้วจะย้อนรายจ่าย/ยอดคงเหลือบัญชีที่ผูกไว้ให้ด้วย */
export async function deleteDebt(uid: string, debtId: string) {
  const ref = debtDocRef(uid, debtId);
  await runTransaction(db, async (tx) => {
    const debtSnap = await tx.get(ref);
    if (!debtSnap.exists()) return;
    const debt = debtSnap.data() as Debt;

    if (debt.status === 'paid' && debt.paidTransactionId) {
      const transactionRef = doc(transactionsCol(uid), debt.paidTransactionId);
      const transactionSnap = await tx.get(transactionRef);
      if (transactionSnap.exists() && !transactionSnap.data().deletedAt) {
        const accountRef = accountDocRef(uid, debt.accountId);
        const accountSnap = await tx.get(accountRef);
        tx.delete(ref);
        tx.update(transactionRef, { deletedAt: serverTimestamp(), updatedAt: serverTimestamp() });
        if (accountSnap.exists()) {
          // ย้อนรายจ่าย = คืนเงินกลับเข้าบัญชี (บวกกลับ ไม่ใช่หักซ้ำ)
          tx.update(accountRef, {
            currentBalanceCents:
              (accountSnap.data().currentBalanceCents as number) + debt.amountCents,
            updatedAt: serverTimestamp(),
          });
        }
        return;
      }
    }

    tx.delete(ref);
  });
}

/** กดว่า "จ่ายแล้ว": สร้างรายจ่ายจริงผูกกับบัญชี/หมวดหมู่ที่ตั้งไว้ และหักยอดคงเหลือแบบอะตอมมิก */
export async function markDebtPaid(uid: string, debtId: string) {
  const ref = debtDocRef(uid, debtId);
  await runTransaction(db, async (tx) => {
    const debtSnap = await tx.get(ref);
    if (!debtSnap.exists()) throw new Error('ไม่พบรายการหนี้นี้');
    const debt = debtSnap.data() as Debt;
    if (debt.status === 'paid') return;

    const categorySnap = await tx.get(categoryDocRef(uid, debt.categoryId));
    if (!categorySnap.exists()) throw new Error('ไม่พบหมวดหมู่ที่ผูกไว้กับรายการนี้');

    const accountRef = accountDocRef(uid, debt.accountId);
    const accountSnap = await tx.get(accountRef);
    if (!accountSnap.exists()) throw new Error('ไม่พบบัญชีที่ผูกไว้กับรายการนี้');

    const transactionRef = doc(transactionsCol(uid));
    tx.set(transactionRef, {
      userId: uid,
      type: 'expense',
      amountCents: debt.amountCents,
      currency: accountSnap.data().currency,
      date: serverTimestamp(),
      accountId: debt.accountId,
      toAccountId: null,
      categoryId: debt.categoryId,
      note: debt.name,
      receiptUrl: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
    });

    tx.update(accountRef, {
      currentBalanceCents: (accountSnap.data().currentBalanceCents as number) - debt.amountCents,
      updatedAt: serverTimestamp(),
    });

    tx.update(ref, {
      status: 'paid',
      paidTransactionId: transactionRef.id,
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

/** ยกเลิกสถานะจ่ายแล้ว (กดผิด): ย้อนรายจ่ายที่สร้างไว้และคืนยอดคงเหลือ */
export async function markDebtUnpaid(uid: string, debtId: string) {
  const ref = debtDocRef(uid, debtId);
  await runTransaction(db, async (tx) => {
    const debtSnap = await tx.get(ref);
    if (!debtSnap.exists()) throw new Error('ไม่พบรายการหนี้นี้');
    const debt = debtSnap.data() as Debt;
    if (debt.status !== 'paid' || !debt.paidTransactionId) return;

    const transactionRef = doc(transactionsCol(uid), debt.paidTransactionId);
    const transactionSnap = await tx.get(transactionRef);
    const accountRef = accountDocRef(uid, debt.accountId);
    const accountSnap = await tx.get(accountRef);

    if (transactionSnap.exists() && !transactionSnap.data().deletedAt) {
      tx.update(transactionRef, { deletedAt: serverTimestamp(), updatedAt: serverTimestamp() });
      if (accountSnap.exists()) {
        // ย้อนรายจ่าย = คืนเงินกลับเข้าบัญชี (บวกกลับ ไม่ใช่หักซ้ำ)
        tx.update(accountRef, {
          currentBalanceCents:
            (accountSnap.data().currentBalanceCents as number) + debt.amountCents,
          updatedAt: serverTimestamp(),
        });
      }
    }

    tx.update(ref, {
      status: 'pending',
      paidTransactionId: null,
      paidAt: null,
      updatedAt: serverTimestamp(),
    });
  });
}
