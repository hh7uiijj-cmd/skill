import { SignJWT, jwtVerify } from 'jose';
import { env } from './env';

export const SESSION_COOKIE = 'admin_session';
const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 hours

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(env.sessionSecret());
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

// Edge-safe: only uses Web Crypto via `jose`, no Node built-ins. Middleware
// (which runs on the Edge Runtime) depends on this staying that way.
export async function isValidSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
};
