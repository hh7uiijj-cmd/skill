import { FieldValue } from 'firebase-admin/firestore';
import { getDb } from './firebaseAdmin';
import { deleteFile, downloadFile, newFileId, pathnameFor, saveFile } from './blobStorage';
import type { WorkFile, WorkInput, WorkRecord } from '../types';

const COLLECTION = 'works';

function toWorkRecord(id: string, data: FirebaseFirestore.DocumentData): WorkRecord {
  return {
    id,
    title: data.title ?? '',
    batch: data.batch ?? '',
    authors: data.authors ?? '',
    description: data.description ?? '',
    files: Array.isArray(data.files) ? data.files : [],
    createdAt: data.createdAt?.toDate?.().toISOString() ?? new Date(0).toISOString(),
    updatedAt: data.updatedAt?.toDate?.().toISOString() ?? new Date(0).toISOString(),
  };
}

export async function listWorks(options: { batch?: string; search?: string } = {}): Promise<WorkRecord[]> {
  const db = getDb();
  const search = options.search?.trim();

  if (search) {
    // Prefix match on title. Firestore range filters must be ordered by the
    // same field, so a text search intentionally ignores the batch filter
    // and the usual "newest first" ordering.
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy('title')
      .where('title', '>=', search)
      .where('title', '<=', `${search}`)
      .get();
    return snapshot.docs.map((doc) => toWorkRecord(doc.id, doc.data()));
  }

  let query: FirebaseFirestore.Query = db.collection(COLLECTION);
  if (options.batch) {
    query = query.where('batch', '==', options.batch);
  }
  query = query.orderBy('createdAt', 'desc');
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => toWorkRecord(doc.id, doc.data()));
}

export async function listBatches(): Promise<string[]> {
  const db = getDb();
  const snapshot = await db.collection(COLLECTION).select('batch').get();
  const batches = new Set<string>();
  snapshot.docs.forEach((doc) => {
    const batch = doc.data().batch;
    if (typeof batch === 'string' && batch.trim()) batches.add(batch.trim());
  });
  return Array.from(batches).sort((a, b) => a.localeCompare(b, 'th'));
}

export async function getWork(id: string): Promise<WorkRecord | null> {
  const db = getDb();
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return toWorkRecord(doc.id, doc.data() ?? {});
}

export interface FileInput {
  buffer: Buffer;
  fileName: string;
  size: number;
  label: string;
}

export async function createWork(input: WorkInput, fileInputs: FileInput[]): Promise<WorkRecord> {
  const db = getDb();
  const docRef = db.collection(COLLECTION).doc();

  const files: WorkFile[] = [];
  for (const fileInput of fileInputs) {
    const storagePath = pathnameFor(docRef.id, newFileId());
    await saveFile(storagePath, fileInput.buffer);
    files.push({ label: fileInput.label, fileName: fileInput.fileName, fileSize: fileInput.size, storagePath });
  }

  const now = FieldValue.serverTimestamp();
  await docRef.set({
    title: input.title,
    batch: input.batch,
    authors: input.authors,
    description: input.description,
    files,
    createdAt: now,
    updatedAt: now,
  });

  const saved = await docRef.get();
  return toWorkRecord(docRef.id, saved.data() ?? {});
}

export async function updateWorkMeta(id: string, input: Partial<WorkInput>): Promise<WorkRecord | null> {
  const db = getDb();
  const docRef = db.collection(COLLECTION).doc(id);
  const existing = await docRef.get();
  if (!existing.exists) return null;

  const update: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (input.title !== undefined) update.title = input.title;
  if (input.batch !== undefined) update.batch = input.batch;
  if (input.authors !== undefined) update.authors = input.authors;
  if (input.description !== undefined) update.description = input.description;

  await docRef.update(update);
  const saved = await docRef.get();
  return toWorkRecord(id, saved.data() ?? {});
}

export async function addFilesToWork(id: string, fileInputs: FileInput[]): Promise<WorkRecord | null> {
  const db = getDb();
  const docRef = db.collection(COLLECTION).doc(id);
  const existing = await docRef.get();
  if (!existing.exists) return null;

  const currentFiles: WorkFile[] = Array.isArray(existing.data()?.files) ? existing.data()!.files : [];
  const newFiles: WorkFile[] = [...currentFiles];
  for (const fileInput of fileInputs) {
    const storagePath = pathnameFor(id, newFileId());
    await saveFile(storagePath, fileInput.buffer);
    newFiles.push({ label: fileInput.label, fileName: fileInput.fileName, fileSize: fileInput.size, storagePath });
  }

  await docRef.update({ files: newFiles, updatedAt: FieldValue.serverTimestamp() });
  const saved = await docRef.get();
  return toWorkRecord(id, saved.data() ?? {});
}

export async function removeFileFromWork(id: string, fileIndex: number): Promise<WorkRecord | null> {
  const db = getDb();
  const docRef = db.collection(COLLECTION).doc(id);
  const existing = await docRef.get();
  if (!existing.exists) return null;

  const currentFiles: WorkFile[] = Array.isArray(existing.data()?.files) ? existing.data()!.files : [];
  const target = currentFiles[fileIndex];
  if (!target) return null;

  const newFiles = currentFiles.filter((_, i) => i !== fileIndex);
  try {
    await deleteFile(target.storagePath);
  } catch {
    // Already gone — don't block removing it from the record.
  }
  await docRef.update({ files: newFiles, updatedAt: FieldValue.serverTimestamp() });
  const saved = await docRef.get();
  return toWorkRecord(id, saved.data() ?? {});
}

export async function deleteWork(id: string): Promise<boolean> {
  const db = getDb();
  const docRef = db.collection(COLLECTION).doc(id);
  const existing = await docRef.get();
  if (!existing.exists) return false;

  const files: WorkFile[] = Array.isArray(existing.data()?.files) ? existing.data()!.files : [];
  for (const file of files) {
    try {
      await deleteFile(file.storagePath);
    } catch {
      // Already gone (or never uploaded) — don't block deleting the record.
    }
  }
  await docRef.delete();
  return true;
}

export async function getFileBuffer(work: WorkRecord, fileIndex: number): Promise<Buffer> {
  const file = work.files[fileIndex];
  if (!file) throw new Error('File not found');
  return downloadFile(file.storagePath);
}
