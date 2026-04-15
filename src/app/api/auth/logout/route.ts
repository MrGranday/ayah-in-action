import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTypedSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}

async function handleLogout(request: NextRequest) {
  const session = await getTypedSession(await cookies());

  // Preserve API keys so users don't have to re-enter them after re-auth
  // Only clear auth tokens
  session.accessToken = undefined;
  session.refreshToken = undefined;
  session.expiresAt = undefined;
  session.user = undefined;
  session.state = undefined;
  session.nonce = undefined;
  session.codeVerifier = undefined;

  await session.save();

  // ?reauth=true — force a fresh OAuth consent screen to pick up new scopes.
  // This is shown when the ScopeDoctor's "Re-authenticate" button is clicked.
  const isReauth = request.nextUrl.searchParams.get('reauth') === 'true';
  const loginUrl = new URL('/login', request.url);
  if (isReauth) {
    loginUrl.searchParams.set('force_consent', 'true');
  }

  return NextResponse.redirect(loginUrl);
}
