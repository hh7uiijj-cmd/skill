import React from 'react';
import { colors } from './ui';

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** ไม่มี native date picker บนเว็บ ใช้ <input type="datetime-local"> ของเบราว์เซอร์แทน */
export function DateTimeField({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  return React.createElement('input', {
    type: 'datetime-local',
    value: toLocalInputValue(value),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = new Date(e.target.value);
      if (!Number.isNaN(next.getTime())) onChange(next);
    },
    style: {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: colors.border,
      borderRadius: 10,
      padding: '12px',
      fontSize: 15,
      color: colors.text,
      backgroundColor: '#fff',
      fontFamily: 'inherit',
      width: '100%',
      boxSizing: 'border-box',
    },
  });
}
