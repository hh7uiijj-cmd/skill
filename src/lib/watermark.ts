import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'node:fs/promises';
import path from 'node:path';

let cachedFontBytes: Buffer | null = null;
let cachedLogoBytes: Buffer | null = null;

async function loadWatermarkFont(): Promise<Buffer> {
  if (!cachedFontBytes) {
    cachedFontBytes = await fs.readFile(
      path.join(process.cwd(), 'assets/fonts/NotoSansThai-Regular.ttf'),
    );
  }
  return cachedFontBytes;
}

async function loadWatermarkLogo(): Promise<Buffer> {
  if (!cachedLogoBytes) {
    cachedLogoBytes = await fs.readFile(path.join(process.cwd(), 'public/watermark-logo.jpg'));
  }
  return cachedLogoBytes;
}

/**
 * Stamps a tiled, semi-transparent watermark logo plus a traceability footer
 * line on every page of a PDF. Used for the "download" copy so it stays
 * identifiable even after it leaves the site.
 */
export async function watermarkPdf(originalBytes: Uint8Array, footerText: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalBytes);
  pdfDoc.registerFontkit(fontkit);
  const font = await pdfDoc.embedFont(await loadWatermarkFont());
  const logo = await pdfDoc.embedJpg(await loadWatermarkLogo());
  const logoAspect = logo.height / logo.width;

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    const logoWidth = Math.min(width, height) * 0.22;
    const logoHeight = logoWidth * logoAspect;
    const colStep = logoWidth * 1.8;
    const rowStep = logoHeight * 1.8;

    for (let y = -rowStep; y < height + rowStep; y += rowStep) {
      for (let x = -logoWidth; x < width + logoWidth; x += colStep) {
        page.drawImage(logo, {
          x,
          y,
          width: logoWidth,
          height: logoHeight,
          opacity: 0.16,
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
