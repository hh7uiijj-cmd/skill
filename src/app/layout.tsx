import type { Metadata } from 'next';
import Link from 'next/link';
import localFont from 'next/font/local';
import { env } from '@/lib/env';
import { isAdminRequest } from '@/lib/apiAuth';
import { getTheme, themeToCssVariables } from '@/lib/theme';
import { listBatches } from '@/lib/works';
import { SiteFooter } from '@/components/SiteFooter';
import './globals.css';

// TH Sarabun New — used for every piece of text on the site (body copy and
// headings alike), so both CSS variables below point at the same font files.
// (next/font requires each call's arguments to be written out as literals,
// so the file list can't be shared via a variable — it's duplicated below.)
const thSarabunBody = localFont({
  src: [
    { path: '../../assets/fonts/th-sarabun-new/THSarabunNew-webfont.woff', weight: '400', style: 'normal' },
    { path: '../../assets/fonts/th-sarabun-new/THSarabunNew_italic-webfont.woff', weight: '400', style: 'italic' },
    { path: '../../assets/fonts/th-sarabun-new/THSarabunNew_bold-webfont.woff', weight: '700', style: 'normal' },
    {
      path: '../../assets/fonts/th-sarabun-new/THSarabunNew_bolditalic-webfont.woff',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-body',
  display: 'swap',
});

const thSarabunDisplay = localFont({
  src: [
    { path: '../../assets/fonts/th-sarabun-new/THSarabunNew-webfont.woff', weight: '400', style: 'normal' },
    { path: '../../assets/fonts/th-sarabun-new/THSarabunNew_italic-webfont.woff', weight: '400', style: 'italic' },
    { path: '../../assets/fonts/th-sarabun-new/THSarabunNew_bold-webfont.woff', weight: '700', style: 'normal' },
    {
      path: '../../assets/fonts/th-sarabun-new/THSarabunNew_bolditalic-webfont.woff',
      weight: '700',
      style: 'italic',
    },
  ],
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
    <html lang="th" className={`${thSarabunBody.variable} ${thSarabunDisplay.variable}`}>
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
