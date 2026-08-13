import {
  addDoc,
  deleteDoc,
  getAggregateFromServer,
  onSnapshot,
  query,
  serverTimestamp,
  sum,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import dayjs from 'dayjs';
import { budgetDocRef, budgetsCol, transactionsCol } from './paths';
import type { Budget, Cents } from '../types/models';
import { isValidAmountCents } from './money';

export interface BudgetInput {
  categoryId: string | null;
  amountCents: Cents;
  monthKey: string; // "YYYY-MM"
}

function validateBudgetInput(input: BudgetInput) {
  if (!isValidAmountCents(input.amountCents)) throw new Error('งบประมาณต้องมากกว่า 0');
  if (!/^\d{4}-\d{2}$/.test(input.monthKey)) throw new Error('เดือนไม่ถูกต้อง');
}

export function subscribeBudgets(
  uid: string,
  monthKey: string,
  onChange: (budgets: Budget[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(budgetsCol(uid), where('monthKey', '==', monthKey));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Budget)),
    onError
  );
}

export async function createBudget(uid: string, input: BudgetInput) {
  validateBudgetInput(input);
  await addDoc(budgetsCol(uid), {
    userId: uid,
    categoryId: input.categoryId,
    amountCents: input.amountCents,
    period: 'monthly',
    monthKey: input.monthKey,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateBudget(uid: string, budgetId: string, amountCents: Cents) {
  if (!isValidAmountCents(amountCents)) throw new Error('งบประมาณต้องมากกว่า 0');
  await updateDoc(budgetDocRef(uid, budgetId), { amountCents, updatedAt: serverTimestamp() });
}

export async function deleteBudget(uid: string, budgetId: string) {
  await deleteDoc(budgetDocRef(uid, budgetId));
}

/** ยอดใช้จ่ายจริงของเดือนนั้น (รวมทุกหมวด หรือเฉพาะหมวดที่ระบุ) คำนวณผ่าน aggregation query ฝั่งเซิร์ฟเวอร์ */
export async function getSpentAmountCents(
  uid: string,
  monthKey: string,
  categoryId: string | null
): Promise<Cents> {
  const start = dayjs(`${monthKey}-01`).startOf('month').toDate();
  const end = dayjs(`${monthKey}-01`).endOf('month').toDate();

  const constraints = [
    where('type', '==', 'expense'),
    where('deletedAt', '==', null),
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end)),
    ...(categoryId ? [where('categoryId', '==', categoryId)] : []),
  ];
  const q = query(transactionsCol(uid), ...constraints);
  const snap = await getAggregateFromServer(q, { total: sum('amountCents') });
  return snap.data().total;
}
