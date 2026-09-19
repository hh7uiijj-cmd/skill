'use client';

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import HTMLFlipBookImport from 'react-pageflip';

interface PageFlipInstance {
  turnToPage: (pageIndex: number) => void;
  getCurrentPageIndex: () => number;
}

interface PageFlipHandle {
  pageFlip: () => PageFlipInstance;
}

const HTMLFlipBook = HTMLFlipBookImport as unknown as React.ForwardRefExoticComponent<
  Record<string, unknown> & { children: React.ReactNode } & React.RefAttributes<PageFlipHandle>
>;

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const PAGE_WIDTH = 420;
const PAGE_HEIGHT = 594;
const NARROW_SCREEN_QUERY = '(max-width: 760px)';

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
}

export function Flipbook({ fileUrl }: FlipbookProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageInput, setPageInput] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);
  const flipRef = useRef<PageFlipHandle>(null);

  const file = useMemo(() => ({ url: fileUrl }), [fileUrl]);

  useEffect(() => {
    const mq = window.matchMedia(NARROW_SCREEN_QUERY);
    const update = () => setIsNarrowScreen(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const handleLoadSuccess = useCallback((doc: { numPages: number }) => {
    setNumPages(doc.numPages);
  }, []);

  useEffect(() => {
    setPageInput(String(pageIndex + 1));
  }, [pageIndex]);

  function goToPage(e: FormEvent) {
    e.preventDefault();
    if (!numPages) return;
    const target = Math.min(Math.max(1, Number(pageInput) || 1), numPages);
    flipRef.current?.pageFlip().turnToPage(target - 1);
    setPageIndex(target - 1);
  }

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
              ref={flipRef}
              width={PAGE_WIDTH}
              height={PAGE_HEIGHT}
              size="fixed"
              minWidth={280}
              maxWidth={600}
              minHeight={400}
              maxHeight={860}
              showCover={false}
              usePortrait={isNarrowScreen}
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/watermark-logo.jpg" alt="" />
        </div>
      </div>
      {numPages ? (
        <form className="viewer-controls" onSubmit={goToPage}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              const target = Math.max(0, pageIndex - 1);
              flipRef.current?.pageFlip().turnToPage(target);
              setPageIndex(target);
            }}
            disabled={pageIndex <= 0}
          >
            ก่อนหน้า
          </button>
          <input
            type="number"
            className="page-jump-input"
            min={1}
            max={numPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            aria-label="ไปที่หน้า"
          />
          <span className="page-indicator">/ {numPages}</span>
          <button type="submit" className="btn btn-secondary">
            ไป
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              const target = Math.min(numPages - 1, pageIndex + 1);
              flipRef.current?.pageFlip().turnToPage(target);
              setPageIndex(target);
            }}
            disabled={pageIndex >= numPages - 1}
          >
            ถัดไป
          </button>
        </form>
      ) : null}
    </div>
  );
}
