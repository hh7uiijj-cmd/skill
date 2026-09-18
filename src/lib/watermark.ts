import { PDFDocument, degrees, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'node:fs/promises';
import path from 'node:path';

let cachedFontBytes: Buffer | null = null;

async function loadWatermarkFont(): Promise<Buffer> {
  if (!cachedFontBytes) {
    cachedFontBytes = await fs.readFile(
      path.join(process.cwd(), 'assets/fonts/NotoSansThai-Regular.ttf'),
    );
  }
  return cachedFontBytes;
}

/**
 * Stamps a tiled, semi-transparent diagonal watermark plus a footer line on
 * every page of a PDF. Used for the "download" copy so it stays traceable
 * even after it leaves the site.
 */
export async function watermarkPdf(originalBytes: Uint8Array, watermarkText: string, footerText: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalBytes);
  pdfDoc.registerFontkit(fontkit);
  const font = await pdfDoc.embedFont(await loadWatermarkFont());

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    const fontSize = Math.max(12, Math.min(width, height) * 0.032);
    const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
    const colStep = textWidth + fontSize * 6;
    const rowStep = fontSize * 6;

    for (let y = -rowStep; y < height + rowStep; y += rowStep) {
      for (let x = -textWidth; x < width + textWidth; x += colStep) {
        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.55, 0.55, 0.55),
          opacity: 0.22,
          rotate: degrees(35),
        });
      }
    }

    page.drawText(footerText, {
      x: 16,
      y: 14,
      size: 8,
      font,
      color: rgb(0.35, 0.35, 0.35),
      opacity: 0.85,
    });
  }

  return pdfDoc.save();
}
