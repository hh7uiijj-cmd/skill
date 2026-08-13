import {
  addDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { accountDocRef, accountsCol } from './paths';
import type { Account, AccountType, Cents } from '../types/models';
import { isValidAmountCents } from './money';

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currency: string;
  initialBalanceCents: Cents; // อนุญาตค่าติดลบได้ (เช่น บัตรเครดิตเป็นหนี้) จึงไม่ผ่าน isValidAmountCents
  color: string;
  icon: string;
}

export function subscribeAccounts(
  uid: string,
  onChange: (accounts: Account[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(accountsCol(uid), where('archived', '==', false), orderBy('sortOrder', 'asc'));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Account)),
    onError
  );
}

export async function createAccount(uid: string, input: CreateAccountInput, sortOrder: number) {
  if (!input.name.trim()) throw new Error('กรุณาระบุชื่อบัญชี');
  if (!Number.isSafeInteger(input.initialBalanceCents)) {
    throw new Error('ยอดเริ่มต้นไม่ถูกต้อง');
  }
  await addDoc(accountsCol(uid), {
    userId: uid,
    name: input.name.trim(),
    type: input.type,
    currency: input.currency,
    initialBalanceCents: input.initialBalanceCents,
    currentBalanceCents: input.initialBalanceCents,
    color: input.color,
    icon: input.icon,
    sortOrder,
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateAccount(
  uid: string,
  accountId: string,
  changes: Partial<Pick<Account, 'name' | 'type' | 'color' | 'icon' | 'sortOrder'>>
) {
  if (changes.name !== undefined && !changes.name.trim()) {
    throw new Error('กรุณาระบุชื่อบัญชี');
  }
  await updateDoc(accountDocRef(uid, accountId), { ...changes, updatedAt: serverTimestamp() });
}

/** เก็บบัญชีไว้เป็นประวัติ (ไม่ลบจริง) เพื่อไม่ให้ธุรกรรมเก่าอ้างอิงบัญชีที่หายไป */
export async function archiveAccount(uid: string, accountId: string) {
  await updateDoc(accountDocRef(uid, accountId), { archived: true, updatedAt: serverTimestamp() });
}

/** ใช้เฉพาะกรณีบัญชีที่เพิ่งสร้างและไม่มีธุรกรรมใดๆ อ้างอิงเลย */
export async function deleteAccountHard(uid: string, accountId: string) {
  await deleteDoc(accountDocRef(uid, accountId));
}

export { isValidAmountCents };
