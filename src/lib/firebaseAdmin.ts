import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { env } from './env';

function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0 && existing[0]) {
    return existing[0];
  }

  // When pointed at the local emulators, the Admin SDK talks to them over
  // plain HTTP and only needs a project id — no real service account.
  if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
    return initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'demo-research-archive',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'demo-research-archive.appspot.com',
    });
  }

  return initializeApp({
    credential: cert({
      projectId: env.firebaseProjectId(),
      clientEmail: env.firebaseClientEmail(),
      privateKey: env.firebasePrivateKey(),
    }),
    storageBucket: env.firebaseStorageBucket(),
  });
}

let firestoreSingleton: Firestore | null = null;
let storageSingleton: Storage | null = null;

export function getDb(): Firestore {
  if (!firestoreSingleton) {
    firestoreSingleton = getFirestore(getAdminApp());
  }
  return firestoreSingleton;
}

export function getBucket() {
  if (!storageSingleton) {
    storageSingleton = getStorage(getAdminApp());
  }
  return storageSingleton.bucket();
}
