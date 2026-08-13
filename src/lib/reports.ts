import { getAggregateFromServer, getDocs, query, sum, Timestamp, where } from 'firebase/firestore';
import dayjs from 'dayjs';
import { transactionsCol } from './paths';
import type { Transaction } from '../types/models';

export interface PeriodSummary {
  incomeCents: number;
  expenseCents: number;
  netCents: number;
}

/** สรุปรายรับ-รายจ่าย-คงเหลือ ของช่วงเวลาที่กำหนด (ไม่รวม transfer) คำนวณฝั่งเซิร์ฟเวอร์ด้วย aggregation query */
export async function getPeriodSummary(uid: string, start: Date, end: Date): Promise<PeriodSummary> {
  const base = [
    where('deletedAt', '==', null),
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end)),
  ];

  const [incomeSnap, expenseSnap] = await Promise.all([
    getAggregateFromServer(query(transactionsCol(uid), ...base, where('type', '==', 'income')), {
      total: sum('amountCents'),
    }),
    getAggregateFromServer(query(transactionsCol(uid), ...base, where('type', '==', 'expense')), {
      total: sum('amountCents'),
    }),
  ]);

  const incomeCents = incomeSnap.data().total;
  const expenseCents = expenseSnap.data().total;
  return { incomeCents, expenseCents, netCents: incomeCents - expenseCents };
}

export interface CategoryBreakdownItem {
  categoryId: string;
  totalCents: number;
}

/** สัดส่วนยอดรวมตามหมวดหมู่ (สำหรับกราฟวงกลม) ของ type ที่ระบุ ในช่วงเวลาที่กำหนด */
export async function getCategoryBreakdown(
  uid: string,
  start: Date,
  end: Date,
  type: 'income' | 'expense'
): Promise<CategoryBreakdownItem[]> {
  const q = query(
    transactionsCol(uid),
    where('deletedAt', '==', null),
    where('type', '==', type),
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end))
  );
  const snap = await getDocs(q);
  const totals = new Map<string, number>();
  snap.docs.forEach((d) => {
    const t = d.data() as Transaction;
    const key = t.categoryId ?? 'uncategorized';
    totals.set(key, (totals.get(key) ?? 0) + t.amountCents);
  });
  return [...totals.entries()]
    .map(([categoryId, totalCents]) => ({ categoryId, totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

export interface TrendPoint {
  label: string; // "2026-08-01" หรือ "2026-08"
  incomeCents: number;
  expenseCents: number;
}

/** ข้อมูลแนวโน้มรายรับ-รายจ่ายแยกตามวัน/เดือน สำหรับกราฟเส้น */
export async function getTrend(
  uid: string,
  start: Date,
  end: Date,
  granularity: 'day' | 'month'
): Promise<TrendPoint[]> {
  const q = query(
    transactionsCol(uid),
    where('deletedAt', '==', null),
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end))
  );
  const snap = await getDocs(q);
  const buckets = new Map<string, { incomeCents: number; expenseCents: number }>();

  snap.docs.forEach((d) => {
    const t = d.data() as Transaction;
    if (t.type === 'transfer') return;
    const label = dayjs(t.date.toDate()).format(granularity === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM');
    const bucket = buckets.get(label) ?? { incomeCents: 0, expenseCents: 0 };
    if (t.type === 'income') bucket.incomeCents += t.amountCents;
    else bucket.expenseCents += t.amountCents;
    buckets.set(label, bucket);
  });

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, v]) => ({ label, ...v }));
}
