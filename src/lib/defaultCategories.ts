import type { EntryType } from '../types/models';

export const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: EntryType;
  icon: string;
  color: string;
}> = [
  { name: 'เงินเดือน', type: 'income', icon: '💰', color: '#22c55e' },
  { name: 'โบนัส', type: 'income', icon: '🎁', color: '#16a34a' },
  { name: 'ธุรกิจ/ฟรีแลนซ์', type: 'income', icon: '💼', color: '#15803d' },
  { name: 'ดอกเบี้ย/เงินปันผล', type: 'income', icon: '📈', color: '#0d9488' },
  { name: 'รายได้อื่นๆ', type: 'income', icon: '➕', color: '#059669' },

  { name: 'อาหาร', type: 'expense', icon: '🍜', color: '#f97316' },
  { name: 'เดินทาง', type: 'expense', icon: '🚗', color: '#3b82f6' },
  { name: 'ที่พัก/ค่าเช่า', type: 'expense', icon: '🏠', color: '#8b5cf6' },
  { name: 'สาธารณูปโภค', type: 'expense', icon: '💡', color: '#eab308' },
  { name: 'ช้อปปิ้ง', type: 'expense', icon: '🛍️', color: '#ec4899' },
  { name: 'สุขภาพ', type: 'expense', icon: '💊', color: '#ef4444' },
  { name: 'บันเทิง', type: 'expense', icon: '🎬', color: '#a855f7' },
  { name: 'การศึกษา', type: 'expense', icon: '📚', color: '#06b6d4' },
  { name: 'ผ่อนชำระ/หนี้สิน', type: 'expense', icon: '💳', color: '#64748b' },
  { name: 'อื่นๆ', type: 'expense', icon: '📦', color: '#78716c' },
];
