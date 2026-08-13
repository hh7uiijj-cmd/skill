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
import { categoryDocRef, categoriesCol } from './paths';
import type { Category, EntryType } from '../types/models';
import { DEFAULT_CATEGORIES } from './defaultCategories';

export function subscribeCategories(
  uid: string,
  type: EntryType | undefined,
  onChange: (categories: Category[]) => void,
  onError?: (err: Error) => void
) {
  const constraints = type
    ? [where('type', '==', type), orderBy('sortOrder', 'asc')]
    : [orderBy('sortOrder', 'asc')];
  const q = query(categoriesCol(uid), ...constraints);
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category)),
    onError
  );
}

export async function seedDefaultCategories(uid: string) {
  await Promise.all(
    DEFAULT_CATEGORIES.map((c, i) =>
      addDoc(categoriesCol(uid), {
        userId: uid,
        name: c.name,
        type: c.type,
        icon: c.icon,
        color: c.color,
        sortOrder: i,
        isDefault: true,
        createdAt: serverTimestamp(),
      })
    )
  );
}

export async function createCategory(
  uid: string,
  input: { name: string; type: EntryType; icon: string; color: string },
  sortOrder: number
) {
  if (!input.name.trim()) throw new Error('กรุณาระบุชื่อหมวดหมู่');
  await addDoc(categoriesCol(uid), {
    userId: uid,
    name: input.name.trim(),
    type: input.type,
    icon: input.icon,
    color: input.color,
    sortOrder,
    isDefault: false,
    createdAt: serverTimestamp(),
  });
}

export async function updateCategory(
  uid: string,
  categoryId: string,
  changes: Partial<Pick<Category, 'name' | 'icon' | 'color' | 'sortOrder'>>
) {
  if (changes.name !== undefined && !changes.name.trim()) {
    throw new Error('กรุณาระบุชื่อหมวดหมู่');
  }
  await updateDoc(categoryDocRef(uid, categoryId), changes);
}

/** ลบได้เฉพาะหมวดหมู่ที่ไม่มีธุรกรรมอ้างอิงแล้ว (ตรวจก่อนเรียกจาก UI) */
export async function deleteCategory(uid: string, categoryId: string) {
  await deleteDoc(categoryDocRef(uid, categoryId));
}
