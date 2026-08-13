import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { serverTimestamp, setDoc } from 'firebase/firestore';
import { auth } from '../config/firebase';
import { userDocRef } from './paths';
import { seedDefaultCategories } from './categories';
import { createAccount } from './accounts';

const DEFAULT_CURRENCY = 'THB';
const DEFAULT_TIMEZONE = 'Asia/Bangkok';

export async function signUp(email: string, password: string, displayName: string) {
  const trimmedEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) throw new Error('อีเมลไม่ถูกต้อง');
  if (password.length < 6) throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');

  const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
  if (displayName.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }

  await setDoc(userDocRef(cred.user.uid), {
    email: trimmedEmail,
    displayName: displayName.trim(),
    baseCurrency: DEFAULT_CURRENCY,
    timezone: DEFAULT_TIMEZONE,
    createdAt: serverTimestamp(),
  });

  await seedDefaultCategories(cred.user.uid);
  await createAccount(
    cred.user.uid,
    {
      name: 'เงินสด',
      type: 'cash',
      currency: DEFAULT_CURRENCY,
      initialBalanceCents: 0,
      color: '#0d9488',
      icon: '💵',
    },
    0
  );

  return cred.user;
}

export async function signIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
  return cred.user;
}

export async function signOutUser() {
  await firebaseSignOut(auth);
}
