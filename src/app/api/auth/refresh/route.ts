import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { getTokenUrl, getBasicAuthHeader } from '@/lib/auth';

let refreshPromise: Promise<unknown> | null = null;

export async function POST(request: NextRequest) {
  if (refreshPromise) {
    await refreshPromise;
    return NextResponse.json({ success: true });
  }

  refreshPromise = (async () => {
    const session = await getIronSession(request.cookies, sessionOptions);
    
    const refreshToken = session.refreshToken;
    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    const tokenUrl = getTokenUrl();
    const authHeader = getBasicAuthHeader();

    const tokenParams = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    try {
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: authHeader,
        },
        body: tokenParams.toString(),
      });

      if (!tokenResponse.ok) {
        return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
      }

      const tokens = await tokenResponse.json();
      
      session.accessToken = tokens.access_token;
      session.expiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;
      
      if (tokens.refresh_token) {
        session.refreshToken = tokens.refresh_token;
      }
      
      await session.save();
    } catch (error) {
      console.error('Token refresh error:', error);
      return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
    }
  })();

  try {
    await refreshPromise;
  } finally {
    refreshPromise = null;
  }

  return NextResponse.json({ success: true });
}
