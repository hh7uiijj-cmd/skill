import { NextResponse } from 'next/server';
import { getOriginalFileBuffer, getWork } from '@/lib/works';

interface Params {
  params: Promise<{ id: string }>;
}

// Streams the original PDF inline for the in-browser flipbook viewer.
// Intentionally not the watermarked copy: the viewer overlays its own
// on-screen watermark, and the "official", traceable watermarked file is
// only produced by /download.
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const work = await getWork(id);
  if (!work) {
    return NextResponse.json({ error: 'ไม่พบผลงานนี้' }, { status: 404 });
  }

  const buffer = await getOriginalFileBuffer(work);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${encodeURIComponent(work.fileName)}"`,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
