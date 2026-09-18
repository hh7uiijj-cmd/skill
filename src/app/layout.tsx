import type { Metadata } from 'next';
import Link from 'next/link';
import { Noto_Sans_Thai, Noto_Serif_Thai } from 'next/font/google';
import { env } from '@/lib/env';
import { isAdminRequest } from '@/lib/apiAuth';
import { getTheme, themeToCssVariables } from '@/lib/theme';
import { listBatches } from '@/lib/works';
import { SiteFooter } from '@/components/SiteFooter';
import './globals.css';

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const notoSerifThai = Noto_Serif_Thai({
  subsets: ['thai', 'latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: env.siteName(),
  description: 'คลังเก็บงานวิจัย เปิดให้อ่านออนไลน์แบบเปิดหน้าหนังสือ พร้อมลายน้ำป้องกันการคัดลอก',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, theme, batches] = await Promise.all([isAdminRequest(), getTheme(), listBatches()]);

  return (
    <html lang="th" className={`${notoSansThai.variable} ${notoSerifThai.variable}`}>
      <head>
        {/* Colors below are re-validated as #rrggbb hex in src/lib/theme.ts before
            reaching this point, so it's safe to inline them directly. */}
        <style>{themeToCssVariables(theme)}</style>
      </head>
      <body>
        <header className="site-header">
          <div className="site-header-inner container">
            <Link href="/" className="brand">
              {env.siteName()}
            </Link>
            <nav className="nav-links">
              <Link href="/">หน้าแรก</Link>
              {isAdmin ? (
                <Link href="/admin" className="btn btn-pill-accent">
                  แผงควบคุมแอดมิน
                </Link>
              ) : (
                <Link href="/admin/login" className="btn btn-pill-accent">
                  สำหรับแอดมิน
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <SiteFooter siteName={env.siteName()} batches={batches} isAdmin={isAdmin} />
      </body>
    </html>
  );
}
