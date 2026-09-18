'use client';

import { forwardRef, useCallback, useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import HTMLFlipBookImport from 'react-pageflip';

const HTMLFlipBook = HTMLFlipBookImport as unknown as React.ComponentType<
  Record<string, unknown> & { children: React.ReactNode }
>;

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const PAGE_WIDTH = 420;
const PAGE_HEIGHT = 594;

interface FlipPageProps {
  pageNumber: number;
}

const FlipPage = forwardRef<HTMLDivElement, FlipPageProps>(function FlipPage({ pageNumber }, ref) {
  return (
    <div className="flipbook-page" ref={ref}>
      <Page pageNumber={pageNumber} width={PAGE_WIDTH} renderAnnotationLayer={false} renderTextLayer={false} />
    </div>
  );
});

interface FlipbookProps {
  fileUrl: string;
  watermarkLabel: string;
}

export function Flipbook({ fileUrl, watermarkLabel }: FlipbookProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const file = useMemo(() => ({ url: fileUrl }), [fileUrl]);

  const handleLoadSuccess = useCallback((doc: { numPages: number }) => {
    setNumPages(doc.numPages);
  }, []);

  const watermarkCells = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  if (error) {
    return <p className="alert alert-error">{error}</p>;
  }

  return (
    <div>
      <div className="flipbook-wrap" onContextMenu={(e) => e.preventDefault()}>
        <Document
          file={file}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={() => setError('ไม่สามารถโหลดไฟล์เอกสารได้ กรุณาลองใหม่อีกครั้ง')}
          loading={<div className="loading-state">กำลังโหลดเอกสาร...</div>}
        >
          {numPages ? (
            <HTMLFlipBook
              width={PAGE_WIDTH}
              height={PAGE_HEIGHT}
              size="fixed"
              minWidth={280}
              maxWidth={600}
              minHeight={400}
              maxHeight={860}
              showCover={false}
              usePortrait
              drawShadow
              flippingTime={500}
              maxShadowOpacity={0.4}
              className="flipbook"
              startPage={0}
              onFlip={(e: { data: number }) => setPageIndex(e.data)}
            >
              {Array.from({ length: numPages }, (_, i) => (
                <FlipPage key={i} pageNumber={i + 1} />
              ))}
            </HTMLFlipBook>
          ) : null}
        </Document>
        <div className="watermark-overlay" aria-hidden="true">
          {watermarkCells.map((i) => (
            <span key={i}>{watermarkLabel}</span>
          ))}
        </div>
      </div>
      {numPages ? (
        <div className="viewer-controls">
          <span className="page-indicator">
            หน้า {pageIndex + 1} / {numPages}
          </span>
        </div>
      ) : null}
    </div>
  );
}
