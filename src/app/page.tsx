import { WorkCard } from '@/components/WorkCard';
import { BatchPills } from '@/components/BatchPills';
import { listBatches, listWorks } from '@/lib/works';

export const dynamic = 'force-dynamic';

interface HomeProps {
  searchParams: Promise<{ batch?: string; search?: string }>;
}

export default async function HomePage({ searchParams }: HomeProps) {
  const { batch, search } = await searchParams;
  const [works, batches] = await Promise.all([listWorks({ batch, search }), listBatches()]);

  return (
    <>
      <section className="hero">
        <div>
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
        <div className="hero-art" aria-hidden="true">
          <svg viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="130" width="160" height="18" rx="4" fill="var(--color-primary)" opacity="0.15" />
            <rect x="45" y="95" width="130" height="34" rx="6" fill="var(--color-primary)" />
            <rect x="55" y="60" width="110" height="34" rx="6" fill="var(--color-accent)" />
            <rect x="65" y="26" width="90" height="34" rx="6" fill="var(--color-primary)" opacity="0.75" />
            <path d="M150 26 v34 l-10 -8 l-10 8 v-34 z" fill="#fff" opacity="0.85" />
          </svg>
        </div>
      </section>

      <BatchPills batches={batches} activeBatch={batch} />

      <h2>{search ? `ผลการค้นหา "${search}"` : 'ผลงานล่าสุด'}</h2>

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
  );
}
