'use client';

import Link from 'next/link';
import { useRef } from 'react';

interface BatchPillsProps {
  batches: string[];
  activeBatch?: string;
}

export function BatchPills({ batches, activeBatch }: BatchPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollBy(amount: number) {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  }

  return (
    <div className="pill-row">
      <button type="button" className="pill-arrow" aria-label="เลื่อนซ้าย" onClick={() => scrollBy(-220)}>
        ←
      </button>
      <div className="pill-scroll" ref={scrollRef}>
        <Link href="/" className={`pill${!activeBatch ? ' active' : ''}`}>
          ทั้งหมด
        </Link>
        {batches.map((batch) => (
          <Link
            key={batch}
            href={`/?batch=${encodeURIComponent(batch)}`}
            className={`pill${activeBatch === batch ? ' active' : ''}`}
          >
            {batch}
          </Link>
        ))}
      </div>
      <button type="button" className="pill-arrow" aria-label="เลื่อนขวา" onClick={() => scrollBy(220)}>
        →
      </button>
    </div>
  );
}
