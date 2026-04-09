import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTypedSession } from '@/lib/session';
import { getTokenUrl, getBasicAuthHeader, parseJwtPayload } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(new URL('/login?error=missing_params', request.url));
  }

  const session = await getTypedSession(await cookies());
 
  if (state !== session.state) {
    return NextResponse.redirect(new URL('/login?error=invalid_state', request.url));
  }

  const tokenUrl = getTokenUrl();
  const authHeader = getBasicAuthHeader();

  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.NEXTAUTH_URL + '/api/auth/callback',
    code_verifier: session.codeVerifier || '',
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
      console.error('Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(new URL('/login?error=token_failed', request.url));
    }

    const tokens = await tokenResponse.json();
    
    const idToken = tokens.id_token;
    if (idToken) {
      const payload = parseJwtPayload(idToken);
      if (payload && session.nonce) {
        const tokenNonce = payload.nonce as string;
        if (tokenNonce !== session.nonce) {
          return NextResponse.redirect(new URL('/login?error=invalid_nonce', request.url));
        }
      }
    }

    session.accessToken = tokens.access_token;
    session.refreshToken = tokens.refresh_token;
    session.idToken = tokens.id_token;
    session.expiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;
    
    if (tokens.id_token) {
      const idPayload = parseJwtPayload(tokens.id_token);
      if (idPayload) {
        session.user = {
          sub: idPayload.sub as string,
          name: idPayload.name as string,
          email: idPayload.email as string,
          picture: idPayload.picture as string | undefined,
        };
      }
    }

    session.codeVerifier = undefined;
    session.state = undefined;
    session.nonce = undefined;
    
    await session.save();

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=callback_failed', request.url));
  }
}
