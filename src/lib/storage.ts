import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { app } from '../config/firebase';

const storage = getStorage(app);

/** อัปโหลดรูปใบเสร็จของธุรกรรม คืนค่า download URL เพื่อเก็บใน receiptUrl */
export async function uploadReceipt(uid: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const filename = `receipts/${uid}/${Date.now()}.jpg`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}
