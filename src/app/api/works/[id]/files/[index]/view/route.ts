import { NextResponse } from 'next/server';
import { getFileBuffer, getWork } from '@/lib/works';

interface Params {
  params: Promise<{ id: string; index: string }>;
}

// Streams the original PDF inline for the in-browser flipbook viewer.
// Intentionally not the watermarked copy: the viewer overlays its own
// on-screen watermark, and the "official", traceable watermarked file is
// only produced by /download.
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

  const buffer = await getFileBuffer(work, fileIndex);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.fileName)}"`,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
