import Link from 'next/link';
import type { WorkRecord } from '@/types';

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

// Card shows only what's needed to recognize a book on a shelf — title and
// รุ่น. Author, description, and date are one click away on the work page.
export function WorkCard({ work }: { work: WorkRecord }) {
  const cover = coverFor(work.id);

  return (
    <Link href={`/works/${work.id}`} className="work-card" style={{ background: cover.bg, color: cover.fg }}>
      <span className="work-card-spine" aria-hidden="true" />
      <span className="work-card-pages" aria-hidden="true" />
      <span className="work-card-batch">รุ่น {work.batch}</span>
      <p className="work-card-title">{work.title}</p>
    </Link>
  );
}
