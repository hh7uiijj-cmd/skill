import { timingSafeEqual } from 'node:crypto';
import { env } from './env';

// Node-only (uses node:crypto) — import this from Route Handlers, never
// from middleware.ts, which runs on the Edge Runtime.
export function verifyAccessCode(submitted: string): boolean {
  const expected = env.adminAccessCode();
  const a = Buffer.from(submitted);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Run a same-cost comparison so the early-return above doesn't create
    // an obvious timing side-channel on code length.
    timingSafeEqual(Buffer.alloc(b.length), Buffer.alloc(b.length));
    return false;
  }
  return timingSafeEqual(a, b);
}
