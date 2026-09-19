export interface WorkFile {
  /** Short label distinguishing this file, e.g. "รายงานฉบับเต็ม" or "บทความ" */
  label: string;
  fileName: string;
  fileSize: number;
  /** Vercel Blob pathname (private access) — see src/lib/blobStorage.ts */
  storagePath: string;
}

export interface WorkRecord {
  id: string;
  title: string;
  batch: string;
  authors: string;
  description: string;
  files: WorkFile[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkInput {
  title: string;
  batch: string;
  authors: string;
  description: string;
}
