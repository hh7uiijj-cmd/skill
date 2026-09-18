import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/apiAuth';
import { deleteWork, getWork, updateWork } from '@/lib/works';
import { validatePdfFile, validateWorkFields } from '@/lib/validation';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const work = await getWork(id);
  if (!work) {
    return NextResponse.json({ error: 'ไม่พบผลงานนี้' }, { status: 404 });
  }
  return NextResponse.json({ work });
}

export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'ต้องเข้าสู่ระบบแอดมินก่อน' }, { status: 401 });
  }

  const { id } = await params;
  const formData = await request.formData();
  const { errors, value } = validateWorkFields({
    title: formData.get('title'),
    batch: formData.get('batch'),
    authors: formData.get('authors'),
    description: formData.get('description'),
  });

  const file = formData.get('file');
  const fileEntry = file instanceof File && file.size > 0 ? file : null;
  if (fileEntry) {
    const fileError = validatePdfFile(fileEntry);
    if (fileError) errors.file = fileError;
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const fileInput = fileEntry
    ? {
        buffer: Buffer.from(await fileEntry.arrayBuffer()),
        fileName: fileEntry.name,
        size: fileEntry.size,
      }
    : undefined;

  const work = await updateWork(id, value, fileInput);
  if (!work) {
    return NextResponse.json({ error: 'ไม่พบผลงานนี้' }, { status: 404 });
  }
  return NextResponse.json({ work });
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'ต้องเข้าสู่ระบบแอดมินก่อน' }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteWork(id);
  if (!deleted) {
    return NextResponse.json({ error: 'ไม่พบผลงานนี้' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
