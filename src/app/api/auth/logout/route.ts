import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { redirect } from 'next/navigation';
import { sessionOptions } from '../../session';

export async function POST(request: NextRequest) {
  const session = await getIronSession(request.cookies, sessionOptions);
  
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
