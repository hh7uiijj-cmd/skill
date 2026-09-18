'use client';

import dynamic from 'next/dynamic';

const Flipbook = dynamic(() => import('./Flipbook').then((m) => m.Flipbook), {
  ssr: false,
  loading: () => <div className="loading-state">กำลังเตรียมตัวอ่าน...</div>,
});

export { Flipbook as FlipbookLoader };
