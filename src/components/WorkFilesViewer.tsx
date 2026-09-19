'use client';

import { useState } from 'react';
import { FlipbookLoader as Flipbook } from '@/components/FlipbookLoader';
import type { WorkFile } from '@/types';

interface WorkFilesViewerProps {
  workId: string;
  files: WorkFile[];
  batch: string;
  siteName: string;
}

export function WorkFilesViewer({ workId, files, batch, siteName }: WorkFilesViewerProps) {
  const [selected, setSelected] = useState(0);
  const file = files[selected];

  if (!file) {
    return <p className="empty-state">ยังไม่มีไฟล์สำหรับผลงานนี้</p>;
  }

  return (
    <div>
      <div className="viewer-actions" style={{ marginBottom: 16 }}>
        {files.length > 1 && (
          <div className="file-tabs">
            {files.map((f, i) => (
              <button
                key={f.storagePath}
                type="button"
                className={`pill${i === selected ? ' active' : ''}`}
                onClick={() => setSelected(i)}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
        <a className="btn btn-primary" href={`/api/works/${workId}/files/${selected}/download`}>
          ดาวน์โหลด &quot;{file.label}&quot; (มีลายน้ำ)
        </a>
      </div>

      <Flipbook
        key={file.storagePath}
        fileUrl={`/api/works/${workId}/files/${selected}/view`}
        watermarkLabel={`${siteName} • ${batch}`}
      />
    </div>
  );
}
