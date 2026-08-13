import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ค่าคอนฟิกดึงจาก Firebase Console > Project Settings > Your apps
// ตั้งค่าใน .env (ดู .env.example) เป็น EXPO_PUBLIC_FIREBASE_* แล้ว Expo จะ inline ให้อัตโนมัติ
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // initializeAuth throws if already called (e.g. fast refresh) - fall back to existing instance
  authInstance = getAuth(app);
}
export const auth = authInstance;

// long polling avoids issues with some proxies/emulators on React Native
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
