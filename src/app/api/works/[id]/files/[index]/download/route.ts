import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { watermarkPdf } from '@/lib/watermark';
import { getFileBuffer, getWork } from '@/lib/works';

interface Params {
  params: Promise<{ id: string; index: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { id, index } = await params;
  const work = await getWork(id);
  if (!work) {
    return NextResponse.json({ error: 'ไม่พบผลงานนี้' }, { status: 404 });
  }

  const fileIndex = Number(index);
  const file = work.files[fileIndex];
  if (!file) {
    return NextResponse.json({ error: 'ไม่พบไฟล์นี้' }, { status: 404 });
  }

  const original = await getFileBuffer(work, fileIndex);

  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const footerText = `ดาวน์โหลดเมื่อ ${stamp} UTC • ${env.siteName()} • ${work.batch}`;

  const watermarked = await watermarkPdf(original, footerText);

  return new NextResponse(new Uint8Array(watermarked), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.fileName)}"`,
      'Cache-Control': 'no-store',
    },
  });
}
