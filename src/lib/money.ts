import type { Cents } from '../types/models';

/**
 * แปลงข้อความที่ผู้ใช้พิมพ์ (เช่น "1,234.50") เป็นจำนวนเต็มหน่วยสตางค์
 * คืนค่า null ถ้ารูปแบบไม่ถูกต้อง หรือค่า <= 0
 * ห้ามใช้ parseFloat แล้วคูณตรงๆ เพราะจุดทศนิยมของ float ทำให้ยอดเพี้ยนได้
 */
export function parseAmountToCents(input: string): Cents | null {
  const cleaned = input.replace(/,/g, '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;

  const [wholePart, fractionPartRaw = ''] = cleaned.split('.');
  const fractionPart = (fractionPartRaw + '00').slice(0, 2);

  const cents = Number(wholePart) * 100 + Number(fractionPart);
  if (!Number.isSafeInteger(cents) || cents <= 0) return null;
  return cents;
}

/** จำนวนเต็มหน่วยสตางค์ -> ข้อความแสดงผล เช่น 10050 -> "100.50" */
export function formatCents(cents: Cents, currency = 'THB'): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.trunc(cents));
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, '0');
  const wholeFormatted = whole.toLocaleString('en-US');
  const amount = `${negative ? '-' : ''}${wholeFormatted}.${frac}`;
  const symbol = currency === 'THB' ? '฿' : `${currency} `;
  return `${symbol}${amount}`;
}

export function isValidAmountCents(cents: unknown): cents is Cents {
  return typeof cents === 'number' && Number.isSafeInteger(cents) && cents > 0;
}
