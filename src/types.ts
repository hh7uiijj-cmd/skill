export interface WorkRecord {
  id: string;
  title: string;
  batch: string;
  authors: string;
  description: string;
  fileName: string;
  fileSize: number;
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
