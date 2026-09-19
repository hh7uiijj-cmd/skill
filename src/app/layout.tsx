import type { Metadata } from 'next';
import Link from 'next/link';
import localFont from 'next/font/local';
import { env } from '@/lib/env';
import { isAdminRequest } from '@/lib/apiAuth';
import { getTheme, LIGHT_THEME, themeToCssVariables } from '@/lib/theme';
import { listBatches } from '@/lib/works';
import { SiteFooter } from '@/components/SiteFooter';
import { ThemeToggle } from '@/components/ThemeToggle';
import './globals.css';

// Runs before first paint so a visitor who already chose light mode (or
// whose OS prefers light, on a first visit) never sees a flash of dark
// mode. Static string, no interpolated data — safe to inline as-is.
const NO_FLASH_THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var light = stored ? stored === 'light' : window.matchMedia('(prefers-color-scheme: light)').matches;
    if (light) document.documentElement.setAttribute('data-theme', 'light');
  } catch (e) {}
})();
`;

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
    <html
      lang="th"
      className={`${thSarabunBody.variable} ${thSarabunDisplay.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
        {/* Colors below are re-validated as #rrggbb hex in src/lib/theme.ts before
            reaching this point, so it's safe to inline them directly. Light mode is a
            fixed palette a visitor can switch to via the header toggle, independent of
            the admin's (dark) theme settings above. */}
        <style>{themeToCssVariables(theme)}</style>
        <style>{themeToCssVariables(LIGHT_THEME, ':root[data-theme="light"]')}</style>
      </head>
      <body>
        <header className="site-header">
          <div className="site-header-inner container">
            <Link href="/" className="brand">
              {env.siteName()}
            </Link>
            <nav className="nav-links">
              <Link href="/">หน้าแรก</Link>
              <ThemeToggle />
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
