'use client';

export function LogoutButton() {
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  return (
    <button type="button" className="btn btn-secondary" onClick={handleLogout}>
      ออกจากระบบ
    </button>
  );
}
