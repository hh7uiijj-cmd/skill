import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { watermarkPdf } from '@/lib/watermark';
import { getOriginalFileBuffer, getWork } from '@/lib/works';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const work = await getWork(id);
  if (!work) {
    return NextResponse.json({ error: 'ไม่พบผลงานนี้' }, { status: 404 });
  }

  const original = await getOriginalFileBuffer(work);

  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const watermarkText = `${env.siteName()} • ${work.batch}`;
  const footerText = `ดาวน์โหลดเมื่อ ${stamp} UTC • ${env.siteName()}`;

  const watermarked = await watermarkPdf(original, watermarkText, footerText);

  return new NextResponse(new Uint8Array(watermarked), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(work.fileName)}"`,
      'Cache-Control': 'no-store',
    },
  });
}
