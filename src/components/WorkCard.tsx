import Link from 'next/link';
import type { WorkRecord } from '@/types';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}

export function WorkCard({ work }: { work: WorkRecord }) {
  return (
    <Link href={`/works/${work.id}`} className="work-card">
      <div className="work-card-cover" aria-hidden="true">
        <span className="work-card-spine" />
        <svg className="work-card-book-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 14c-6-5-15-6-22-3v38c7-3 16-2 22 3V14z" fill="rgba(255,255,255,0.92)" />
          <path d="M32 14c6-5 15-6 22-3v38c-7-3-16-2-22 3V14z" fill="rgba(255,255,255,0.6)" />
          <path d="M32 14v46" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
        </svg>
        <span className="badge">{work.batch}</span>
      </div>
      <div className="work-card-body">
        <p className="work-title">{work.title}</p>
        {work.authors && <p className="work-meta">โดย {work.authors}</p>}
        <p className="work-meta">เผยแพร่เมื่อ {formatDate(work.createdAt)}</p>
      </div>
    </Link>
  );
}
