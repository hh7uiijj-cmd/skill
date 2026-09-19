import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/apiAuth';
import { addFilesToWork, type FileInput } from '@/lib/works';
import { validateFileLabel, validatePdfFile } from '@/lib/validation';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'ต้องเข้าสู่ระบบแอดมินก่อน' }, { status: 401 });
  }

  const { id } = await params;
  const formData = await request.formData();
  const fileEntries = formData.getAll('files').filter((f): f is File => f instanceof File);
  const labelEntries = formData.getAll('labels').map((l) => (typeof l === 'string' ? l.trim() : ''));

  const errors: Record<string, string> = {};
  if (fileEntries.length === 0) {
    errors.files = 'กรุณาแนบไฟล์ PDF อย่างน้อย 1 ไฟล์';
  }
  fileEntries.forEach((file, i) => {
    const fileError = validatePdfFile(file);
    if (fileError) errors[`file-${i}`] = fileError;
    const labelError = validateFileLabel(labelEntries[i] ?? '');
    if (labelError) errors[`label-${i}`] = labelError;
  });

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const fileInputs: FileInput[] = await Promise.all(
    fileEntries.map(async (file, i) => ({
      buffer: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      size: file.size,
      label: labelEntries[i]!,
    })),
  );

  const work = await addFilesToWork(id, fileInputs);
  if (!work) {
    return NextResponse.json({ error: 'ไม่พบผลงานนี้' }, { status: 404 });
  }
  return NextResponse.json({ work }, { status: 201 });
}
