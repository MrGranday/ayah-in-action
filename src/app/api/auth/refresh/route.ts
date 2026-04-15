import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTypedSession } from '@/lib/session';
import { getTokenUrl, getBasicAuthHeader } from '@/lib/auth';

export async function POST(_request: NextRequest) {
  try {
    const session = await getTypedSession(await cookies());

    const refreshToken = session.refreshToken;
    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    const tokenParams = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const tokenResponse = await fetch(getTokenUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: getBasicAuthHeader(),
      },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text();
      console.error('[Auth/Refresh] Token refresh failed:', tokenResponse.status, body);
      return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
    }

    const tokens = await tokenResponse.json();

    session.accessToken = tokens.access_token;
    session.expiresAt = Math.floor(Date.now() / 1000) + (tokens.expires_in ?? 3600);
    if (tokens.refresh_token) {
      session.refreshToken = tokens.refresh_token;
    }

    await session.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Auth/Refresh] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
