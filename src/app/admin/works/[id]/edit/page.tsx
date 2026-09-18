import { notFound } from 'next/navigation';
import { getWork, listBatches } from '@/lib/works';
import { WorkForm } from '@/components/WorkForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditWorkPage({ params }: Props) {
  const { id } = await params;
  const [work, batches] = await Promise.all([getWork(id), listBatches()]);
  if (!work) notFound();

  return (
    <>
      <h1>แก้ไขผลงาน</h1>
      <p className="subtitle">แก้ไขข้อมูลของ &quot;{work.title}&quot;</p>
      <WorkForm mode="edit" work={work} batches={batches} />
    </>
  );
}
