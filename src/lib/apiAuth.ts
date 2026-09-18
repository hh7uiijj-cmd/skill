import { cookies } from 'next/headers';
import { isValidSessionToken, SESSION_COOKIE } from './auth';

export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return isValidSessionToken(token);
}
