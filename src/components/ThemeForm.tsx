'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { SiteTheme } from '@/lib/theme';

const FIELDS: { key: keyof SiteTheme; label: string; hint: string }[] = [
  { key: 'primary', label: 'สีหลัก', hint: 'แถบบนสุด, แถบท้ายเว็บ, หัวข้อ' },
  { key: 'accent', label: 'สีเน้น', hint: 'ปุ่มหลัก, ป้ายรุ่นที่เลือก' },
  { key: 'background', label: 'สีพื้นหลังเว็บ', hint: 'พื้นหลังทั้งหน้า' },
  { key: 'surface', label: 'สีพื้นการ์ด', hint: 'การ์ดผลงาน, กล่องฟอร์ม' },
  { key: 'ink', label: 'สีตัวอักษร', hint: 'สีข้อความหลัก' },
];

export function ThemeForm({ theme }: { theme: SiteTheme }) {
  const router = useRouter();
  const [values, setValues] = useState<SiteTheme>(theme);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        setError('บันทึกไม่สำเร็จ กรุณาลองใหม่');
        return;
      }
      setMessage('บันทึกสีของเว็บไซต์แล้ว');
      router.refresh();
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 520 }}>
      {message && <p className="alert alert-success">{message}</p>}
      {error && <p className="alert alert-error">{error}</p>}

      {FIELDS.map(({ key, label, hint }) => (
        <div className="field" key={key}>
          <label htmlFor={key}>{label}</label>
          <span className="hint">{hint}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              id={key}
              type="color"
              value={values[key]}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            />
            <code>{values[key]}</code>
          </div>
        </div>
      ))}

      <div className="theme-swatches" aria-hidden="true">
        {FIELDS.map(({ key, label }) => (
          <div className="theme-swatch" key={key}>
            <span className="theme-swatch-dot" style={{ background: values[key] }} />
            {label}
          </div>
        ))}
      </div>

      <div className="row-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'บันทึกสีเว็บไซต์'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => router.push('/admin')}>
          ย้อนกลับ
        </button>
      </div>
    </form>
  );
}
