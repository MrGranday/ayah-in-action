import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTypedSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  const session = await getTypedSession(await cookies());
  session.accessToken = undefined;
  session.refreshToken = undefined;
  session.idToken = undefined;
  session.expiresAt = undefined;
  session.user = undefined;
  
  await session.save();

  return NextResponse.redirect(new URL('/login', request.url));
}

export async function GET(request: NextRequest) {
  return POST(request);
}
