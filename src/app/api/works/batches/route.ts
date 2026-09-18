import { NextResponse } from 'next/server';
import { listBatches } from '@/lib/works';

export async function GET() {
  const batches = await listBatches();
  return NextResponse.json({ batches });
}
