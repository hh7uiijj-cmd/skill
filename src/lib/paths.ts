import { collection, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * ข้อมูลผู้ใช้ทั้งหมดอยู่ใต้ users/{uid}/... เสมอ
 * -> ทุก query ถูก "กรองด้วย user_id" โดยธรรมชาติ (ผ่าน path + Security Rules ที่ตรวจ auth.uid)
 * ป้องกันข้อมูลรั่วข้ามผู้ใช้ได้แน่นอนกว่าการพึ่ง where('userId', '==', uid) เพียงอย่างเดียว
 */
export const userDocRef = (uid: string) => doc(db, 'users', uid);
export const accountsCol = (uid: string) => collection(db, 'users', uid, 'accounts');
export const accountDocRef = (uid: string, accountId: string) =>
  doc(db, 'users', uid, 'accounts', accountId);
export const categoriesCol = (uid: string) => collection(db, 'users', uid, 'categories');
export const categoryDocRef = (uid: string, categoryId: string) =>
  doc(db, 'users', uid, 'categories', categoryId);
export const transactionsCol = (uid: string) => collection(db, 'users', uid, 'transactions');
export const transactionDocRef = (uid: string, transactionId: string) =>
  doc(db, 'users', uid, 'transactions', transactionId);
export const budgetsCol = (uid: string) => collection(db, 'users', uid, 'budgets');
export const budgetDocRef = (uid: string, budgetId: string) =>
  doc(db, 'users', uid, 'budgets', budgetId);
