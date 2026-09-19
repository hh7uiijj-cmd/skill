'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.documentElement.getAttribute('data-theme') === 'light');
    setMounted(true);
  }, []);

  function toggle() {
    const next = !isLight;
    setIsLight(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'light' : 'dark');
    } catch {
      // Private browsing or storage disabled — the toggle still works for
      // this page load, it just won't be remembered next visit.
    }
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={isLight ? 'สลับเป็นโหมดมืด' : 'สลับเป็นโหมดสว่าง'}
      title={isLight ? 'สลับเป็นโหมดมืด' : 'สลับเป็นโหมดสว่าง'}
    >
      {mounted ? (isLight ? '🌙' : '☀️') : null}
    </button>
  );
}
