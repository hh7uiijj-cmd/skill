// Best-effort, single-instance in-memory throttle for the login endpoint.
// It resets on redeploy/restart and does not share state across instances,
// but it stops trivial scripted brute-forcing of the access code.

interface Bucket {
  failures: number;
  lockedUntil: number;
}

const buckets = new Map<string, Bucket>();
const MAX_FAILURES = 5;
const LOCKOUT_MS = 60_000;

export function isLockedOut(key: string): boolean {
  const bucket = buckets.get(key);
  if (!bucket) return false;
  return bucket.lockedUntil > Date.now();
}

export function recordFailure(key: string): void {
  const bucket = buckets.get(key) ?? { failures: 0, lockedUntil: 0 };
  bucket.failures += 1;
  if (bucket.failures >= MAX_FAILURES) {
    bucket.lockedUntil = Date.now() + LOCKOUT_MS;
    bucket.failures = 0;
  }
  buckets.set(key, bucket);
}

export function recordSuccess(key: string): void {
  buckets.delete(key);
}
