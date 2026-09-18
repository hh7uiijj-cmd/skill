import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { env } from './env';

// Firestore only (Spark/free plan is enough — no Blaze upgrade needed).
// PDF files live in Vercel Blob instead of Firebase Storage; see blobStorage.ts.
function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0 && existing[0]) {
    return existing[0];
  }

  // When pointed at the local Firestore emulator, the Admin SDK talks to it
  // over plain HTTP and only needs a project id — no real service account.
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'demo-research-archive',
    });
  }

  return initializeApp({
    credential: cert({
      projectId: env.firebaseProjectId(),
      clientEmail: env.firebaseClientEmail(),
      privateKey: env.firebasePrivateKey(),
    }),
  });
}

let firestoreSingleton: Firestore | null = null;

export function getDb(): Firestore {
  if (!firestoreSingleton) {
    firestoreSingleton = getFirestore(getAdminApp());
  }
  return firestoreSingleton;
}
