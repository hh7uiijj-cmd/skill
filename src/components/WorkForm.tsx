'use client';

import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import type { WorkRecord } from '@/types';

interface WorkFormProps {
  mode: 'create' | 'edit';
  work?: WorkRecord;
  batches: string[];
}

interface FieldErrors {
  [key: string]: string;
}

interface FileRow {
  key: string;
  label: string;
}

export function WorkForm({ mode, work, batches }: WorkFormProps) {
  const router = useRouter();
  const idPrefix = useId();
  const [title, setTitle] = useState(work?.title ?? '');
  const [batch, setBatch] = useState(work?.batch ?? '');
  const [authors, setAuthors] = useState(work?.authors ?? '');
  const [description, setDescription] = useState(work?.description ?? '');
  const [fileRows, setFileRows] = useState<FileRow[]>([{ key: `${idPrefix}-0`, label: '' }]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function addFileRow() {
    setFileRows((rows) => [...rows, { key: `${idPrefix}-${rows.length}-${Date.now()}`, label: '' }]);
  }

  function removeFileRow(key: string) {
    setFileRows((rows) => (rows.length > 1 ? rows.filter((r) => r.key !== key) : rows));
  }

  function setRowLabel(key: string, label: string) {
    setFileRows((rows) => rows.map((r) => (r.key === key ? { ...r, label } : r)));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const rawFormData = new FormData(e.currentTarget);
      const formData = new FormData();
      formData.set('title', rawFormData.get('title') ?? '');
      formData.set('batch', rawFormData.get('batch') ?? '');
      formData.set('authors', rawFormData.get('authors') ?? '');
      formData.set('description', rawFormData.get('description') ?? '');

      if (mode === 'create') {
        for (const row of fileRows) {
          const fileInput = e.currentTarget.querySelector<HTMLInputElement>(`[data-file-key="${row.key}"]`);
          const file = fileInput?.files?.[0];
          if (file) {
            formData.append('files', file);
            formData.append('labels', row.label);
          }
        }
      }

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
      {errors.files && <p className="error-text">{errors.files}</p>}

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

      {mode === 'create' && (
        <div className="field">
          <label className="required">ไฟล์ PDF</label>
          <span className="hint">
            เพิ่มได้มากกว่า 1 ไฟล์ต่อผลงาน (เช่น &quot;รายงานฉบับเต็ม&quot; และ &quot;บทความ&quot;) — ตั้งชื่อกำกับแต่ละไฟล์ให้ชัดเจน
          </span>
          {fileRows.map((row, i) => (
            <div key={row.key} className="file-row">
              <input
                type="text"
                placeholder="ชื่อไฟล์ เช่น รายงานฉบับเต็ม, บทความ"
                value={row.label}
                onChange={(e) => setRowLabel(row.key, e.target.value)}
                maxLength={100}
              />
              <input type="file" accept="application/pdf" data-file-key={row.key} required />
              {fileRows.length > 1 && (
                <button type="button" className="btn btn-secondary" onClick={() => removeFileRow(row.key)}>
                  ลบ
                </button>
              )}
              {errors[`label-${i}`] && <p className="error-text">{errors[`label-${i}`]}</p>}
              {errors[`file-${i}`] && <p className="error-text">{errors[`file-${i}`]}</p>}
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={addFileRow} style={{ alignSelf: 'flex-start' }}>
            + เพิ่มไฟล์อีกรายการ
          </button>
        </div>
      )}

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
