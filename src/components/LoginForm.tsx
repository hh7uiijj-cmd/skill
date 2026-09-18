'use client';

import { useState, type FormEvent } from 'react';

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'เข้าสู่ระบบไม่สำเร็จ');
        return;
      }
      window.location.href = nextPath;
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" style={{ maxWidth: 380 }} onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="code" className="required">
          รหัสสำหรับแอดมิน
        </label>
        <input
          id="code"
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
          required
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={loading || !code}>
        {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
      </button>
    </form>
  );
}
