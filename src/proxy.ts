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

  // Check session for all protected routes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await getTypedSession(request as any);

  if (!session.accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Proactive token refresh when < 5 minutes to expiry
  const expiresAt = session.expiresAt || 0;
  const now = Math.floor(Date.now() / 1000);
  const fiveMinutes = 5 * 60;

  if (expiresAt > 0 && expiresAt - now < fiveMinutes && session.refreshToken) {
    try {
      const refreshRes = await fetch(new URL('/api/auth/refresh', request.url).toString(), {
        method: 'POST',
        headers: { Cookie: request.headers.get('cookie') || '' },
      });
      if (!refreshRes.ok) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch {
      // Silent fail — let the request through; it will 401 on the API call
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/).*)'],
};
