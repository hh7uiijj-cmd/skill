import { notFound } from 'next/navigation';
import { env } from '@/lib/env';
import { getWork } from '@/lib/works';
import { FlipbookLoader as Flipbook } from '@/components/FlipbookLoader';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkViewerPage({ params }: Props) {
  const { id } = await params;
  const work = await getWork(id);
  if (!work) notFound();

  return (
    <div className="viewer-page">
      <div className="viewer-meta">
        <div>
          <span className="badge">{work.batch}</span>
          <h1>{work.title}</h1>
          {work.authors && <p className="work-meta">โดย {work.authors}</p>}
          {work.description && <p>{work.description}</p>}
        </div>
        <div className="viewer-actions">
          <a className="btn btn-primary" href={`/api/works/${work.id}/download`}>
            ดาวน์โหลด (มีลายน้ำ)
          </a>
        </div>
      </div>

      <Flipbook fileUrl={`/api/works/${work.id}/view`} watermarkLabel={`${env.siteName()} • ${work.batch}`} />

      <p className="work-meta">
        การอ่านออนไลน์นี้มีลายน้ำกำกับเพื่อป้องกันการคัดลอก หากต้องการไฟล์เก็บไว้ กรุณากดปุ่มดาวน์โหลดด้านบน
        ซึ่งจะมีลายน้ำระบุแหล่งที่มาและวันเวลาที่ดาวน์โหลดกำกับไว้ในทุกหน้าเช่นกัน
      </p>
    </div>
  );
}
