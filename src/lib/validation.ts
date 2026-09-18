import type { WorkInput } from '../types';

export interface FieldErrors {
  [field: string]: string;
}

export function validateWorkFields(data: {
  title?: FormDataEntryValue | null;
  batch?: FormDataEntryValue | null;
  authors?: FormDataEntryValue | null;
  description?: FormDataEntryValue | null;
}): { errors: FieldErrors; value: WorkInput } {
  const errors: FieldErrors = {};

  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const batch = typeof data.batch === 'string' ? data.batch.trim() : '';
  const authors = typeof data.authors === 'string' ? data.authors.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';

  if (!title) errors.title = 'กรุณากรอกชื่อผลงาน';
  else if (title.length > 300) errors.title = 'ชื่อผลงานยาวเกินไป (ไม่เกิน 300 ตัวอักษร)';

  if (!batch) errors.batch = 'กรุณากรอกรุ่น';
  else if (batch.length > 100) errors.batch = 'ชื่อรุ่นยาวเกินไป (ไม่เกิน 100 ตัวอักษร)';

  if (authors.length > 500) errors.authors = 'รายชื่อผู้จัดทำยาวเกินไป';
  if (description.length > 5000) errors.description = 'คำอธิบายยาวเกินไป';

  return { errors, value: { title, batch, authors, description } };
}

export const MAX_PDF_BYTES = 50 * 1024 * 1024; // 50 MB

export function validatePdfFile(file: File | null): string | null {
  if (!file) return 'กรุณาแนบไฟล์ PDF';
  const nameLower = file.name.toLowerCase();
  const isPdfType = file.type === 'application/pdf' || nameLower.endsWith('.pdf');
  if (!isPdfType) return 'ไฟล์ต้องเป็น PDF เท่านั้น';
  if (file.size > MAX_PDF_BYTES) return 'ไฟล์ใหญ่เกินไป (จำกัดไม่เกิน 50MB)';
  if (file.size === 0) return 'ไฟล์ว่างเปล่า';
  return null;
}
