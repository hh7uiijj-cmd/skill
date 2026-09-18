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
      <span className="badge">{work.batch}</span>
      <p className="work-title">{work.title}</p>
      {work.authors && <p className="work-meta">โดย {work.authors}</p>}
      <p className="work-meta">เผยแพร่เมื่อ {formatDate(work.createdAt)}</p>
    </Link>
  );
}
