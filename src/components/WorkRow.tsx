import Link from 'next/link';
import { WorkCard } from '@/components/WorkCard';
import type { WorkRecord } from '@/types';

interface WorkRowProps {
  title: string;
  works: WorkRecord[];
  viewAllHref?: string;
}

export function WorkRow({ title, works, viewAllHref }: WorkRowProps) {
  if (works.length === 0) return null;

  return (
    <section className="row-section">
      <div className="row-header">
        <h2>{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="row-viewall">
            ดูทั้งหมด →
          </Link>
        )}
      </div>
      <div className="row-scroll">
        {works.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>
    </section>
  );
}
