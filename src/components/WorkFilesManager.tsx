'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import type { WorkFile } from '@/types';

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function WorkFilesManager({ workId, files }: { workId: string; files: WorkFile[] }) {
  const router = useRouter();
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [label, setLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(index: number, fileLabel: string) {
    if (!window.confirm(`ลบไฟล์ "${fileLabel}" ใช่หรือไม่?`)) return;
    setDeletingIndex(index);
    try {
      const res = await fetch(`/api/works/${workId}/files/${index}`, { method: 'DELETE' });
      if (!res.ok) {
        alert('ลบไฟล์ไม่สำเร็จ กรุณาลองใหม่');
        return;
      }
      router.refresh();
    } finally {
      setDeletingIndex(null);
    }
  }

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');
    const file = fileInput?.files?.[0];
    if (!file || !label.trim()) {
      setError('กรุณากรอกชื่อไฟล์และเลือกไฟล์ PDF');
      return;
    }

    setAdding(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('labels', label.trim());
      const res = await fetch(`/api/works/${workId}/files`, { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'เพิ่มไฟล์ไม่สำเร็จ');
        return;
      }
      setLabel('');
      form.reset();
      router.refresh();
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h2 style={{ marginTop: 0 }}>ไฟล์ของผลงานนี้</h2>

      {files.length === 0 ? (
        <p className="empty-state">ยังไม่มีไฟล์</p>
      ) : (
        <div className="files-manager-list">
          {files.map((file, i) => (
            <div className="files-manager-item" key={file.storagePath}>
              <div>
                <strong>{file.label}</strong>
                <p className="work-meta">
                  {file.fileName} • {formatSize(file.fileSize)}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDelete(i, file.label)}
                disabled={deletingIndex === i}
              >
                {deletingIndex === i ? 'กำลังลบ...' : 'ลบ'}
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd}>
        {error && <p className="error-text">{error}</p>}
        <div className="file-row">
          <input
            type="text"
            placeholder="ชื่อไฟล์ เช่น รายงานฉบับเต็ม, บทความ"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={100}
          />
          <input type="file" accept="application/pdf" />
          <button type="submit" className="btn btn-secondary" disabled={adding}>
            {adding ? 'กำลังเพิ่ม...' : '+ เพิ่มไฟล์'}
          </button>
        </div>
      </form>
    </div>
  );
}
