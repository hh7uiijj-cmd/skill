import type { Metadata } from 'next';
import Link from 'next/link';
import { env } from '@/lib/env';
import { isAdminRequest } from '@/lib/apiAuth';
import './globals.css';

export const metadata: Metadata = {
  title: env.siteName(),
  description: 'คลังเก็บงานวิจัย เปิดให้อ่านออนไลน์แบบเปิดหน้าหนังสือ พร้อมลายน้ำป้องกันการคัดลอก',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await isAdminRequest();

  return (
    <html lang="th">
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand">
              {env.siteName()}
            </Link>
            <nav className="nav-links">
              <Link href="/">หน้าแรก</Link>
              {isAdmin ? <Link href="/admin">แผงควบคุมแอดมิน</Link> : <Link href="/admin/login">สำหรับแอดมิน</Link>}
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
