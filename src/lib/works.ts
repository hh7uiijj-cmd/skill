import { FieldValue } from 'firebase-admin/firestore';
import { getBucket, getDb } from './firebaseAdmin';
import type { WorkInput, WorkRecord } from '../types';

const COLLECTION = 'works';

function storagePathFor(id: string) {
  return `works/${id}/original.pdf`;
}

function toWorkRecord(id: string, data: FirebaseFirestore.DocumentData): WorkRecord {
  return {
    id,
    title: data.title ?? '',
    batch: data.batch ?? '',
    authors: data.authors ?? '',
    description: data.description ?? '',
    fileName: data.fileName ?? '',
    fileSize: data.fileSize ?? 0,
    storagePath: data.storagePath ?? storagePathFor(id),
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

interface FileInput {
  buffer: Buffer;
  fileName: string;
  size: number;
}

export async function createWork(input: WorkInput, file: FileInput): Promise<WorkRecord> {
  const db = getDb();
  const docRef = db.collection(COLLECTION).doc();

  await getBucket().file(storagePathFor(docRef.id)).save(file.buffer, {
    contentType: 'application/pdf',
    resumable: false,
  });

  const now = FieldValue.serverTimestamp();
  await docRef.set({
    title: input.title,
    batch: input.batch,
    authors: input.authors,
    description: input.description,
    fileName: file.fileName,
    fileSize: file.size,
    storagePath: storagePathFor(docRef.id),
    createdAt: now,
    updatedAt: now,
  });

  const saved = await docRef.get();
  return toWorkRecord(docRef.id, saved.data() ?? {});
}

export async function updateWork(id: string, input: Partial<WorkInput>, file?: FileInput): Promise<WorkRecord | null> {
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

  if (file) {
    await getBucket().file(storagePathFor(id)).save(file.buffer, {
      contentType: 'application/pdf',
      resumable: false,
    });
    update.fileName = file.fileName;
    update.fileSize = file.size;
  }

  await docRef.update(update);
  const saved = await docRef.get();
  return toWorkRecord(id, saved.data() ?? {});
}

export async function deleteWork(id: string): Promise<boolean> {
  const db = getDb();
  const docRef = db.collection(COLLECTION).doc(id);
  const existing = await docRef.get();
  if (!existing.exists) return false;

  await getBucket().file(storagePathFor(id)).delete({ ignoreNotFound: true });
  await docRef.delete();
  return true;
}

export async function getOriginalFileBuffer(work: WorkRecord): Promise<Buffer> {
  const [buffer] = await getBucket().file(work.storagePath).download();
  return buffer;
}
