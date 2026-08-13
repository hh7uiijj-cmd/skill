import type { Timestamp } from 'firebase/firestore';

export type EntryType = 'income' | 'expense';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type AccountType = 'cash' | 'bank' | 'credit_card' | 'e_wallet';
export type BudgetPeriod = 'monthly';

/** เก็บเงินเป็นจำนวนเต็มหน่วยสตางค์เสมอ (ห้ามใช้ float) เช่น 100.50 บาท => amountCents = 10050 */
export type Cents = number;

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  baseCurrency: string; // เช่น "THB"
  timezone: string; // เช่น "Asia/Bangkok"
  createdAt: Timestamp;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  /** ยอดตั้งต้นตอนสร้างบัญชี (หน่วยสตางค์) ยอดคงเหลือจริงคำนวณจาก initialBalanceCents + ธุรกรรมทั้งหมด */
  initialBalanceCents: Cents;
  /** แคชยอดคงเหลือปัจจุบัน อัปเดตแบบอะตอมมิกคู่กับการเขียนธุรกรรมใน runTransaction เดียวกัน */
  currentBalanceCents: Cents;
  color: string;
  icon: string;
  sortOrder: number;
  archived: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: EntryType;
  icon: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
  createdAt: Timestamp;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amountCents: Cents;
  currency: string;
  /** เวลาธุรกรรม (UTC timestamp ฝั่งเซิร์ฟเวอร์/Firestore) */
  date: Timestamp;
  accountId: string;
  /** ใช้เฉพาะ type === 'transfer' คือบัญชีปลายทาง */
  toAccountId?: string | null;
  /** ใช้เฉพาะ type === 'income' | 'expense' */
  categoryId?: string | null;
  note: string;
  receiptUrl?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** soft delete: null = ยังไม่ลบ */
  deletedAt: Timestamp | null;
}

export interface Budget {
  id: string;
  userId: string;
  /** null = งบรวมทุกหมวดหมู่ */
  categoryId: string | null;
  amountCents: Cents;
  period: BudgetPeriod;
  /** เดือนของงบ รูปแบบ "YYYY-MM" ตาม timezone ผู้ใช้ */
  monthKey: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
