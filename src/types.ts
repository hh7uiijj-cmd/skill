export interface WorkRecord {
  id: string;
  title: string;
  batch: string;
  authors: string;
  description: string;
  fileName: string;
  fileSize: number;
  /** Vercel Blob pathname (private access) — see src/lib/blobStorage.ts */
  storagePath: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkInput {
  title: string;
  batch: string;
  authors: string;
  description: string;
}
