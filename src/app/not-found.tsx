import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>ไม่พบหน้านี้</h1>
      <p>ผลงานหรือหน้าที่คุณค้นหาอาจถูกลบหรือย้ายไปแล้ว</p>
      <Link href="/" className="btn btn-primary">
        กลับหน้าแรก
      </Link>
    </div>
  );
}
