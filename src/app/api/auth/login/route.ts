import { NextResponse } from 'next/server';
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth';
import { verifyAccessCode } from '@/lib/accessCode';
import { isLockedOut, recordFailure, recordSuccess } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (isLockedOut(ip)) {
    return NextResponse.json(
      { error: 'ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่' },
      { status: 429 },
    );
  }

  let code = '';
  try {
    const body = await request.json();
    code = typeof body?.code === 'string' ? body.code : '';
  } catch {
    return NextResponse.json({ error: 'คำขอไม่ถูกต้อง' }, { status: 400 });
  }

  if (!code || !verifyAccessCode(code)) {
    recordFailure(ip);
    return NextResponse.json({ error: 'รหัสไม่ถูกต้อง' }, { status: 401 });
  }

  recordSuccess(ip);
  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
}
