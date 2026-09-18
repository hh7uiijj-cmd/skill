import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/apiAuth';
import { createWork, listWorks } from '@/lib/works';
import { validatePdfFile, validateWorkFields } from '@/lib/validation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const batch = searchParams.get('batch')?.trim() || undefined;
  const works = await listWorks(batch);
  return NextResponse.json({ works });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'ต้องเข้าสู่ระบบแอดมินก่อน' }, { status: 401 });
  }

  const formData = await request.formData();
  const { errors, value } = validateWorkFields({
    title: formData.get('title'),
    batch: formData.get('batch'),
    authors: formData.get('authors'),
    description: formData.get('description'),
  });

  const file = formData.get('file');
  const fileEntry = file instanceof File ? file : null;
  const fileError = validatePdfFile(fileEntry);
  if (fileError) errors.file = fileError;

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const buffer = Buffer.from(await (fileEntry as File).arrayBuffer());
  const work = await createWork(value, {
    buffer,
    fileName: (fileEntry as File).name,
    size: (fileEntry as File).size,
  });

  return NextResponse.json({ work }, { status: 201 });
}
