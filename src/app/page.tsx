import { WorkCard } from '@/components/WorkCard';
import { WorkRow } from '@/components/WorkRow';
import { BatchPills } from '@/components/BatchPills';
import { listBatches, listWorks } from '@/lib/works';
import type { WorkRecord } from '@/types';

export const dynamic = 'force-dynamic';

interface HomeProps {
  searchParams: Promise<{ batch?: string; search?: string }>;
}

/** Groups already-sorted (newest first) works by batch, preserving the order
 * each batch first appears in — so the row for the batch with the most
 * recent upload comes first, like a "recently active" ordering. */
function groupByBatch(works: WorkRecord[]): { batch: string; works: WorkRecord[] }[] {
  const order: string[] = [];
  const groups = new Map<string, WorkRecord[]>();
  for (const work of works) {
    if (!groups.has(work.batch)) {
      order.push(work.batch);
      groups.set(work.batch, []);
    }
    groups.get(work.batch)!.push(work);
  }
  return order.map((batch) => ({ batch, works: groups.get(batch)! }));
}

export default async function HomePage({ searchParams }: HomeProps) {
  const { batch, search } = await searchParams;
  const isFiltered = Boolean(batch || search);
  const [works, batches] = await Promise.all([listWorks({ batch, search }), listBatches()]);

  return (
    <>
      <section className="hero-full">
        <div className="hero-inner">
          <h1>ให้งานวิจัยพาคุณไปสู่มุมมองใหม่</h1>
          <p className="subtitle">
            อ่านออนไลน์แบบเปิดหน้าหนังสือได้ทันที ไม่ว่าคุณกำลังมองหาแรงบันดาลใจ ความรู้ หรือแนวคิดใหม่ ๆ
            ที่นี่มีคำตอบให้คุณ
          </p>
          <form className="hero-search" method="get">
            <input type="text" name="search" defaultValue={search ?? ''} placeholder="ค้นหาชื่อผลงาน" />
            <button type="submit" className="btn btn-primary">
              ค้นหา
            </button>
          </form>
        </div>
      </section>

      <BatchPills batches={batches} activeBatch={batch} />

      {isFiltered ? (
        <>
          <h2>{search ? `ผลการค้นหา "${search}"` : `รุ่น ${batch}`}</h2>
          {works.length === 0 ? (
            <p className="empty-state">ยังไม่มีผลงานในหมวดนี้</p>
          ) : (
            <div className="work-grid">
              {works.map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          )}
        </>
      ) : works.length === 0 ? (
        <p className="empty-state">ยังไม่มีผลงานในหมวดนี้</p>
      ) : (
        <>
          <WorkRow title="ผลงานล่าสุด" works={works.slice(0, 12)} />
          {groupByBatch(works).map(({ batch: rowBatch, works: rowWorks }) => (
            <WorkRow
              key={rowBatch}
              title={`รุ่น ${rowBatch}`}
              works={rowWorks}
              viewAllHref={`/?batch=${encodeURIComponent(rowBatch)}`}
            />
          ))}
        </>
      )}
    </>
  );
}
