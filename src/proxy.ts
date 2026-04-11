import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTypedSession } from '@/lib/session';

const publicPaths = [
  '/',
  '/login',
  '/api/auth/login',
  '/api/auth/callback',
  '/api/auth/logout',
  '/api/auth/refresh',
  '/api/auth/me',
  '/api/ayah',
  '/api/voice',
  '/favicon.ico',
  '/icons',
  '/manifest.webmanifest',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public + static paths
  if (
    publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  console.log('[Proxy] Checking auth for:', pathname);

  try {
    // In Proxy/Middleware, we pass the request.cookies object
    const session = await getTypedSession(request.cookies);

    if (!session.accessToken) {
      console.warn('[Proxy] No session found. Redirecting to login.');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Proactive token refresh when < 5 minutes to expiry
    const expiresAt = session.expiresAt || 0;
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutes = 5 * 60;

    if (expiresAt > 0 && expiresAt - now < fiveMinutes && session.refreshToken) {
      console.log('[Proxy] Token expiring soon. Attempting refresh...');
      const refreshRes = await fetch(new URL('/api/auth/refresh', request.url).toString(), {
        method: 'POST',
        headers: { Cookie: request.headers.get('cookie') || '' },
      });
      if (!refreshRes.ok) {
        console.error('[Proxy] Refresh failed. Redirecting to login.');
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('[Proxy] Error checking session:', error);
    return NextResponse.redirect(new URL('/login?error=session_error', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/).*)'],
};
