import { notFound } from 'next/navigation';
import { getWork } from '@/lib/works';
import { WorkFilesViewer } from '@/components/WorkFilesViewer';

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
      </div>

      <WorkFilesViewer workId={work.id} files={work.files} />

      <p className="work-meta">
        การอ่านออนไลน์นี้มีลายน้ำกำกับเพื่อป้องกันการคัดลอก หากต้องการไฟล์เก็บไว้ กรุณากดปุ่มดาวน์โหลดด้านบน
        ซึ่งจะมีลายน้ำระบุแหล่งที่มาและวันเวลาที่ดาวน์โหลดกำกับไว้ในทุกหน้าเช่นกัน
      </p>
    </div>
  );
}
