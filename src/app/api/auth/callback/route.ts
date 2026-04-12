import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTypedSession } from '@/lib/session';
import { getTokenUrl, getBasicAuthHeader, parseJwtPayload } from '@/lib/auth';
import { qfConfig } from '@/lib/qf-config';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const returnedState = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  console.log('[Auth/Callback] ─── Reached ───────────────────────────');
  console.log('[Auth/Callback] Query params:', searchParams.toString());
  console.log('[Auth/Callback] QF_ENV:', qfConfig.env);
  console.log('[Auth/Callback] Auth base URL:', qfConfig.authBaseUrl);
  console.log('[Auth/Callback] API base URL:', qfConfig.apiBaseUrl);
  console.log('[Auth/Callback] Callback URL:', qfConfig.callbackUrl);

  // ── 1. Provider-returned error ─────────────────────────────────────────────
  if (error) {
    console.error('[Auth/Callback] Provider returned error:', error, '|', errorDescription);
    const msg = encodeURIComponent(`${error}: ${errorDescription || 'no description'}`);
    redirect(`/login?error=callback_failed&msg=${msg}`);
  }

  // ── 2. Missing required params ─────────────────────────────────────────────
  if (!code || !returnedState) {
    console.warn(
      '[Auth/Callback] Missing code or state. Keys present:',
      Array.from(searchParams.keys())
    );
    redirect('/login?error=missing_params');
  }

  // ── 3. Load session & validate state (CSRF guard) ──────────────────────────
  const cookieStore = await cookies();
  const session = await getTypedSession(cookieStore);

  console.log('[Auth/Callback] Session state (stored):', session.state ? '✓ present' : '✗ missing');

  if (!session.state || returnedState !== session.state) {
    console.error(
      '[Auth/Callback] State mismatch. Expected:',
      session.state,
      '| Got:',
      returnedState
    );
    redirect('/login?error=invalid_state');
  }

  // ── 4. Token exchange (HTTP Basic Auth + PKCE) ─────────────────────────────
  const tokenUrl = getTokenUrl();
  const authHeader = getBasicAuthHeader();

  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code as string,
    redirect_uri: qfConfig.callbackUrl,
    code_verifier: session.codeVerifier || '',
  });

  console.log('[Auth/Callback] Exchanging code at:', tokenUrl);

  let tokens: Record<string, unknown>;

  try {
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: authHeader,
      },
      body: tokenParams.toString(),
    });

    const rawBody = await tokenResponse.text();
    console.log('[Auth/Callback] Token endpoint status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      console.error('[Auth/Callback] Token exchange failed. Body:', rawBody);
      const msg = encodeURIComponent(`token_exchange_${tokenResponse.status}: ${rawBody.slice(0, 200)}`);
      redirect(`/login?error=token_failed&msg=${msg}`);
    }

    tokens = JSON.parse(rawBody);
    console.log(
      '[Auth/Callback] Token exchange OK. Token types received:',
      Object.keys(tokens).filter((k) => k.includes('token') || k === 'expires_in')
    );
  } catch (err: unknown) {
    if ((err as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw err;
    console.error('[Auth/Callback] Token exchange threw:', err);
    const msg = encodeURIComponent((err as Error)?.message || String(err));
    redirect(`/login?error=token_failed&msg=${msg}`);
  }

  // ── 5. Nonce validation (replay-attack guard) ──────────────────────────────
  const idToken = tokens.id_token as string | undefined;

  if (idToken && session.nonce) {
    const idPayload = parseJwtPayload(idToken);
    const tokenNonce = idPayload?.nonce as string | undefined;

    console.log(
      '[Auth/Callback] Nonce check — stored:',
      session.nonce,
      '| token:',
      tokenNonce ?? 'missing'
    );

    if (!tokenNonce || tokenNonce !== session.nonce) {
      console.error('[Auth/Callback] Nonce validation FAILED');
      redirect('/login?error=invalid_nonce');
    }
    console.log('[Auth/Callback] Nonce validation ✓');
  } else {
    console.warn('[Auth/Callback] Skipping nonce check — id_token or stored nonce missing');
  }

  // ── 6. Extract user info (id_token → /userinfo fallback) ──────────────────
  let userSub: string | undefined;
  let userName: string | undefined;
  let userEmail: string | undefined;
  let userPicture: string | undefined;

  if (idToken) {
    const idPayload = parseJwtPayload(idToken);
    if (idPayload) {
      userSub = idPayload.sub as string | undefined;
      userName = (idPayload.name ?? idPayload.given_name) as string | undefined;
      userEmail = idPayload.email as string | undefined;
      userPicture = idPayload.picture as string | undefined;
    }
  }

  // Fallback: call /userinfo if name or email are missing
  if ((!userName || !userEmail) && tokens.access_token) {
    try {
      console.log('[Auth/Callback] Fetching /userinfo for missing profile fields');
      const userInfoResponse = await fetch(`${qfConfig.authBaseUrl}/userinfo`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json() as Record<string, unknown>;
        console.log('[Auth/Callback] /userinfo fields:', Object.keys(userInfo));
        userSub ??= userInfo.sub as string | undefined;
        userName ??= (userInfo.name ?? userInfo.given_name) as string | undefined;
        userEmail ??= userInfo.email as string | undefined;
        userPicture ??= userInfo.picture as string | undefined;
      } else {
        console.warn('[Auth/Callback] /userinfo returned:', userInfoResponse.status);
      }
    } catch (uiErr) {
      console.warn('[Auth/Callback] /userinfo fetch failed (non-critical):', uiErr);
    }
  }

  // ── 7. Persist session ─────────────────────────────────────────────────────
  // NOTE: idToken is intentionally NOT stored in session — it's a large JWT that
  // pushes the iron-session cookie over the 4096-byte browser limit.
  // User info has already been extracted from it above.
  session.accessToken = tokens.access_token as string;
  session.refreshToken = tokens.refresh_token as string | undefined;
  session.expiresAt = Math.floor(Date.now() / 1000) + (tokens.expires_in as number || 3600);

  if (userSub) {
    session.user = {
      sub: userSub,
      name: userName || (userEmail ? userEmail.split('@')[0] : 'Quran.com User'),
      email: userEmail || '',
      // Cap picture URL length — long CDN URLs can bloat the cookie
      picture: userPicture ? userPicture.slice(0, 200) : undefined,
    };
    console.log('[Auth/Callback] User saved to session — sub:', userSub, '| name:', userName);
  } else {
    console.warn('[Auth/Callback] Could not extract user sub — session saved without user info');
  }

  // Clear PKCE / flow state
  session.codeVerifier = undefined;
  session.state = undefined;
  session.nonce = undefined;

  await session.save();
  console.log('[Auth/Callback] Session saved ✓ — redirecting to /dashboard');

  redirect('/dashboard');
}
