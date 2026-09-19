import Link from 'next/link';
import type { WorkRecord } from '@/types';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}

function initial(title: string): string {
  return title.trim().charAt(0) || '?';
}

export function WorkCard({ work }: { work: WorkRecord }) {
  return (
    <Link href={`/works/${work.id}`} className="work-card">
      <div className="work-card-cover" aria-hidden="true">
        {initial(work.title)}
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
