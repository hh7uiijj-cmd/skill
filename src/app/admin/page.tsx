import Link from 'next/link';
import { listWorks } from '@/lib/works';
import { DeleteWorkButton } from '@/components/DeleteWorkButton';
import { LogoutButton } from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export default async function AdminDashboardPage() {
  const works = await listWorks();

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h1>แผงควบคุมแอดมิน</h1>
          <p className="subtitle">จัดการผลงานวิจัยทั้งหมด ({works.length} รายการ)</p>
        </div>
        <div className="row-actions">
          <Link href="/admin/upload" className="btn btn-primary">
            + เพิ่มผลงานใหม่
          </Link>
          <Link href="/admin/theme" className="btn btn-secondary">
            ตั้งค่าธีมสี
          </Link>
          <LogoutButton />
        </div>
      </div>

      {works.length === 0 ? (
        <p className="empty-state">ยังไม่มีผลงาน กด &quot;เพิ่มผลงานใหม่&quot; เพื่อเริ่มต้น</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ชื่อผลงาน</th>
              <th>รุ่น</th>
              <th>ผู้จัดทำ</th>
              <th>เผยแพร่เมื่อ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {works.map((work) => (
              <tr key={work.id}>
                <td>
                  <Link href={`/works/${work.id}`}>{work.title}</Link>
                </td>
                <td>{work.batch}</td>
                <td>{work.authors || '—'}</td>
                <td>{formatDate(work.createdAt)}</td>
                <td>
                  <div className="row-actions">
                    <Link href={`/admin/works/${work.id}/edit`} className="btn btn-secondary">
                      แก้ไข
                    </Link>
                    <DeleteWorkButton id={work.id} title={work.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
