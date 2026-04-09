import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';

export async function POST(request: NextRequest) {
  const session = await getIronSession(request.cookies, sessionOptions);
  const sessionData = session as any;
  
  sessionData.accessToken = undefined;
  sessionData.refreshToken = undefined;
  sessionData.idToken = undefined;
  sessionData.expiresAt = undefined;
  sessionData.user = undefined;
  
  await session.save();

  return NextResponse.redirect(new URL('/login', request.url));
}

export async function GET(request: NextRequest) {
  return POST(request);
}
