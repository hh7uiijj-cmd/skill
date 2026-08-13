// firebase-js-sdk ships getReactNativePersistence only in its "react-native" export condition,
// which Metro resolves correctly at runtime, but the "firebase/auth" .d.ts (resolved via the
// generic "types" condition) omits it. This augments the module's type declarations to match.
import type { Persistence } from '@firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: unknown): Persistence;
}

export {};
