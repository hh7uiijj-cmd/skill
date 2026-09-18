import Link from 'next/link';

interface SiteFooterProps {
  siteName: string;
  batches: string[];
  isAdmin: boolean;
}

export function SiteFooter({ siteName, batches, isAdmin }: SiteFooterProps) {
  const year = new Date().getFullYear() + 543;

  return (
    <footer className="site-footer">
      <div className="site-footer-inner container">
        <div className="footer-col">
          <p className="footer-brand">{siteName}</p>
          <p className="footer-text">
            คลังเก็บและเผยแพร่งานวิจัย อ่านออนไลน์แบบเปิดหน้าหนังสือได้ทันที
            ทุกไฟล์ที่ดาวน์โหลดมีลายน้ำกำกับเพื่อป้องกันการคัดลอก
          </p>
        </div>

        <div className="footer-col">
          <p className="footer-heading">รุ่น</p>
          {batches.length === 0 ? (
            <span className="footer-text">ยังไม่มีข้อมูล</span>
          ) : (
            <ul className="footer-links">
              {batches.slice(0, 6).map((batch) => (
                <li key={batch}>
                  <Link href={`/?batch=${encodeURIComponent(batch)}`}>{batch}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="footer-col">
          <p className="footer-heading">สำหรับแอดมิน</p>
          <ul className="footer-links">
            <li>
              <Link href={isAdmin ? '/admin' : '/admin/login'}>{isAdmin ? 'แผงควบคุมแอดมิน' : 'เข้าสู่ระบบแอดมิน'}</Link>
            </li>
            {isAdmin && (
              <li>
                <Link href="/admin/theme">ตั้งค่าธีมสี</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="site-footer-bottom">© {year} {siteName}</div>
    </footer>
  );
}
