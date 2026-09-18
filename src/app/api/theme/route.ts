import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/apiAuth';
import { DEFAULT_THEME, getTheme, isValidHexColor, saveTheme, type SiteTheme } from '@/lib/theme';

export async function GET() {
  const theme = await getTheme();
  return NextResponse.json({ theme });
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'ต้องเข้าสู่ระบบแอดมินก่อน' }, { status: 401 });
  }

  let body: Partial<Record<keyof SiteTheme, unknown>>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'คำขอไม่ถูกต้อง' }, { status: 400 });
  }

  const errors: Record<string, string> = {};
  for (const key of Object.keys(DEFAULT_THEME) as (keyof SiteTheme)[]) {
    if (!isValidHexColor(body[key])) {
      errors[key] = 'กรุณาเลือกสีให้ถูกต้อง';
    }
  }
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const theme = await saveTheme(body);
  return NextResponse.json({ theme });
}
