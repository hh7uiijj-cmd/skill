'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeleteWorkButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`ต้องการลบผลงาน "${title}" ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/works/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        alert('ลบไม่สำเร็จ กรุณาลองใหม่');
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>
      {loading ? 'กำลังลบ...' : 'ลบ'}
    </button>
  );
}
