import { randomUUID } from 'node:crypto';
import { del, get, put } from '@vercel/blob';
import { env } from './env';

// PDF files live in Vercel Blob (private access — never a public URL) instead
// of Firebase Storage, so hosting only needs Firestore's free Spark plan.
// Each file within a work gets its own random id so files can be added or
// removed independently without colliding pathnames.

export function pathnameFor(workId: string, fileId: string): string {
  return `works/${workId}/${fileId}.pdf`;
}

export function newFileId(): string {
  return randomUUID();
}

// Fail fast instead of hanging through the SDK's own retry/backoff if Blob
// is unreachable or misconfigured — a stuck request would otherwise just
// run until the host platform's own function timeout kills it.
const REQUEST_TIMEOUT_MS = 20_000;

export async function saveFile(pathname: string, buffer: Buffer): Promise<void> {
  await put(pathname, buffer, {
    access: 'private',
    contentType: 'application/pdf',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: env.blobReadWriteToken(),
    abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

export async function downloadFile(pathname: string): Promise<Buffer> {
  const result = await get(pathname, {
    access: 'private',
    token: env.blobReadWriteToken(),
    abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!result || result.stream === null) {
    throw new Error(`Blob not found: ${pathname}`);
  }
  const arrayBuffer = await new Response(result.stream).arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function deleteFile(pathname: string): Promise<void> {
  await del(pathname, { token: env.blobReadWriteToken(), abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
}
