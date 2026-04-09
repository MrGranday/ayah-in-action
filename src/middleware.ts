import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';

const publicPaths = ['/login', '/api/auth/login', '/api/auth/callback', '/api/auth/logout', '/api/auth/refresh'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/' || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/ayah') || pathname.startsWith('/api/voice')) {
    return NextResponse.next();
  }

  const session = await getIronSession(request.cookies, sessionOptions);

  if (!session.accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const expiresAt = session.expiresAt || 0;
  const now = Math.floor(Date.now() / 1000);
  const fiveMinutes = 5 * 60;

  if (expiresAt > 0 && expiresAt - now < fiveMinutes) {
    try {
      const refreshRes = await fetch(new URL('/api/auth/refresh', request.url).toString(), {
        method: 'POST',
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      });

      if (!refreshRes.ok) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
