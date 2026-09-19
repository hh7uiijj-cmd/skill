import Link from 'next/link';
import type { WorkRecord } from '@/types';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}

// A small curated palette (navy/gold brand colors plus a few complementary
// tones) so covers read as distinct printed books sitting on a shelf,
// rather than one repeated gradient. Picked deterministically per work id
// so the same work always gets the same "cover" on every render.
const COVER_PALETTE: { bg: string; fg: string }[] = [
  { bg: '#12163a', fg: '#f4f3fa' },
  { bg: '#e3b91d', fg: '#1a1a2e' },
  { bg: '#a8433f', fg: '#fbeee2' },
  { bg: '#2f5d54', fg: '#eef6f2' },
  { bg: '#efe6d3', fg: '#2a2115' },
  { bg: '#463f52', fg: '#f1ebe0' },
  { bg: '#7a4b2a', fg: '#fbeee0' },
  { bg: '#385274', fg: '#f0f4fa' },
];

function coverFor(id: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return COVER_PALETTE[hash % COVER_PALETTE.length]!;
}

export function WorkCard({ work }: { work: WorkRecord }) {
  const cover = coverFor(work.id);

  return (
    <Link href={`/works/${work.id}`} className="work-card">
      <div className="work-card-cover" style={{ background: cover.bg, color: cover.fg }} aria-hidden="true">
        <span className="work-card-cover-batch">รุ่น {work.batch}</span>
        <p className="work-card-cover-title">{work.title}</p>
      </div>
      <div className="work-card-body">
        <p className="work-title">{work.title}</p>
        {work.authors && <p className="work-meta">โดย {work.authors}</p>}
        <p className="work-meta">เผยแพร่เมื่อ {formatDate(work.createdAt)}</p>
      </div>
    </Link>
  );
}
