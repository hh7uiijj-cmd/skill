import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/apiAuth';

export async function GET() {
  const authenticated = await isAdminRequest();
  return NextResponse.json({ authenticated });
}
