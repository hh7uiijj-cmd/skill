import { listBatches } from '@/lib/works';
import { WorkForm } from '@/components/WorkForm';

export const dynamic = 'force-dynamic';

export default async function UploadWorkPage() {
  const batches = await listBatches();

  return (
    <>
      <h1>เพิ่มผลงานใหม่</h1>
      <p className="subtitle">กรอกข้อมูลให้ครบถ้วน โดยเฉพาะ &quot;ชื่อผลงาน&quot; และ &quot;รุ่น&quot; ซึ่งจำเป็นสำหรับจัดหมวดหมู่</p>
      <WorkForm mode="create" batches={batches} />
    </>
  );
}
