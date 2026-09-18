'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { WorkRecord } from '@/types';

interface WorkFormProps {
  mode: 'create' | 'edit';
  work?: WorkRecord;
  batches: string[];
}

interface FieldErrors {
  [key: string]: string;
}

export function WorkForm({ mode, work, batches }: WorkFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(work?.title ?? '');
  const [batch, setBatch] = useState(work?.batch ?? '');
  const [authors, setAuthors] = useState(work?.authors ?? '');
  const [description, setDescription] = useState(work?.description ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const url = mode === 'create' ? '/api/works' : `/api/works/${work?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(url, { method, body: formData });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setFormError(data.error ?? 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
        }
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setFormError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      {formError && <p className="alert alert-error">{formError}</p>}

      <div className="field">
        <label htmlFor="title" className="required">
          ชื่อผลงาน
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={300}
          required
        />
        {errors.title && <p className="error-text">{errors.title}</p>}
      </div>

      <div className="field">
        <label htmlFor="batch" className="required">
          รุ่น / ปีการศึกษา
        </label>
        <span className="hint">เช่น &quot;รุ่นที่ 12&quot; หรือ &quot;ปีการศึกษา 2568&quot; — พิมพ์ให้ตรงกับรุ่นเดิมเพื่อจัดกลุ่มถูกต้อง</span>
        <input
          id="batch"
          name="batch"
          type="text"
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
          list="batch-suggestions"
          maxLength={100}
          required
        />
        <datalist id="batch-suggestions">
          {batches.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
        {errors.batch && <p className="error-text">{errors.batch}</p>}
      </div>

      <div className="field">
        <label htmlFor="authors">ผู้จัดทำ / นักวิจัย</label>
        <input
          id="authors"
          name="authors"
          type="text"
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
          maxLength={500}
          placeholder="คั่นด้วยเครื่องหมายจุลภาค (,) หากมีหลายคน"
        />
        {errors.authors && <p className="error-text">{errors.authors}</p>}
      </div>

      <div className="field">
        <label htmlFor="description">คำอธิบาย / บทคัดย่อ</label>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={5000}
        />
        {errors.description && <p className="error-text">{errors.description}</p>}
      </div>

      <div className="field">
        <label htmlFor="file" className={mode === 'create' ? 'required' : ''}>
          ไฟล์ PDF
        </label>
        {mode === 'edit' && work && (
          <span className="hint">
            ไฟล์ปัจจุบัน: {work.fileName} — เว้นว่างไว้หากไม่ต้องการเปลี่ยนไฟล์
          </span>
        )}
        <input id="file" name="file" type="file" accept="application/pdf" required={mode === 'create'} />
        {errors.file && <p className="error-text">{errors.file}</p>}
      </div>

      <div className="row-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'กำลังบันทึก...' : mode === 'create' ? 'เพิ่มผลงาน' : 'บันทึกการแก้ไข'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => router.push('/admin')}>
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
