import { WorkCard } from '@/components/WorkCard';
import { listBatches, listWorks } from '@/lib/works';

export const dynamic = 'force-dynamic';

interface HomeProps {
  searchParams: Promise<{ batch?: string }>;
}

export default async function HomePage({ searchParams }: HomeProps) {
  const { batch } = await searchParams;
  const [works, batches] = await Promise.all([listWorks(batch), listBatches()]);

  return (
    <>
      <h1>คลังงานวิจัย</h1>
      <p className="subtitle">อ่านออนไลน์แบบเปิดหน้าหนังสือได้ทันที ไฟล์ที่ดาวน์โหลดจะมีลายน้ำกำกับเสมอ</p>

      {batches.length > 0 && (
        <form className="filter-bar" method="get">
          <select name="batch" defaultValue={batch ?? ''}>
            <option value="">ทุกรุ่น</option>
            {batches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-secondary">
            กรองตามรุ่น
          </button>
        </form>
      )}

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
