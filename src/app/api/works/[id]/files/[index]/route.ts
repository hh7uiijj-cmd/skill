import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/apiAuth';
import { removeFileFromWork } from '@/lib/works';

interface Params {
  params: Promise<{ id: string; index: string }>;
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'ต้องเข้าสู่ระบบแอดมินก่อน' }, { status: 401 });
  }

  const { id, index } = await params;
  const fileIndex = Number(index);
  if (!Number.isInteger(fileIndex) || fileIndex < 0) {
    return NextResponse.json({ error: 'ไฟล์ไม่ถูกต้อง' }, { status: 400 });
  }

  const work = await removeFileFromWork(id, fileIndex);
  if (!work) {
    return NextResponse.json({ error: 'ไม่พบผลงานหรือไฟล์นี้' }, { status: 404 });
  }
  return NextResponse.json({ work });
}
