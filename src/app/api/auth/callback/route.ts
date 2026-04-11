import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTypedSession } from '@/lib/session';
import { getTokenUrl, getBasicAuthHeader, parseJwtPayload } from '@/lib/auth';
import { qfConfig } from '@/lib/qf-config';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  console.log('[Auth] Callback reached');
  console.log('[Auth] Full Query:', searchParams.toString());

  if (error) {
    console.error('[Auth] Provider returned error:', error, errorDescription);
    const msg = encodeURIComponent(`${error}: ${errorDescription || ''}`);
    redirect(`/login?error=callback_failed&msg=${msg}`);
  }

  if (!code || !state) {
    console.warn('[Auth] Callback missing code or state. Params present:', Array.from(searchParams.keys()));
    redirect('/login?error=missing_params');
  }

  const cookieStore = await cookies();
  const session = await getTypedSession(cookieStore);
 
  if (state !== session.state) {
    console.error('[Auth] State mismatch. Expected:', session.state, 'Got:', state);
    redirect('/login?error=invalid_state');
  }

  const tokenUrl = getTokenUrl();
  const authHeader = getBasicAuthHeader();

  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: qfConfig.callbackUrl,
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
      const errorText = await tokenResponse.text();
      console.error('[Auth] Token exchange failed:', errorText);
      redirect('/login?error=token_failed');
    }

    const tokens = await tokenResponse.json();
    console.log('[Auth] Token exchange successful');
    
    const idToken = tokens.id_token;
    if (idToken) {
      const payload = parseJwtPayload(idToken);
      if (payload && session.nonce) {
        const tokenNonce = payload.nonce as string;
        if (tokenNonce !== session.nonce) {
          console.error('[Auth] Nonce validation failed');
          redirect('/login?error=invalid_nonce');
        }
      }
    }

    session.accessToken = tokens.access_token;
    session.refreshToken = tokens.refresh_token;
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
    console.log('[Auth] Session saved. Redirecting to dashboard.');

    redirect('/dashboard');
  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('[Auth] Callback error:', error);
    const msg = encodeURIComponent(error?.message || String(error));
    redirect(`/login?error=callback_failed&msg=${msg}`);
  }
}
