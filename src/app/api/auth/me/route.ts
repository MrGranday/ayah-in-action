import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';

export async function GET(request: NextRequest) {
  const session = await getIronSession(await cookies(), sessionOptions);

  const sessionData = session as any;

  if (!sessionData.accessToken || !sessionData.user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: sessionData.user });
}
