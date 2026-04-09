import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTypedSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const session = await getTypedSession(await cookies());

  if (!session.accessToken || !session.user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: session.user });
}
