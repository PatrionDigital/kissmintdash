import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.redirect(new URL('/api/notify', process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'));
}

export const dynamic = 'force-dynamic';
