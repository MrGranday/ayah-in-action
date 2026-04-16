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
      userName = (idPayload.name ?? idPayload.given_name ?? idPayload.nickname ?? idPayload.preferred_username) as string | undefined;
      userEmail = idPayload.email as string | undefined;
      userPicture = idPayload.picture as string | undefined;
    }
  }

  // Fallback: call QF profile endpoints to get the real display name
  // Priority: /auth/v2/profile (returns first_name/last_name) → /auth/v1/me → /userinfo
  if ((!userName || !userEmail) && tokens.access_token) {
    try {
      // ── Try v2 profile first (needs user.profile.read scope) ──────────────
      console.log('[Auth/Callback] Fetching /auth/v2/profile for real name');
      const v2Res = await fetch(`${qfConfig.apiBaseUrl}/auth/v2/profile`, {
        headers: {
          'x-auth-token': tokens.access_token as string,
          'x-client-id': qfConfig.clientId,
        },
      });

      if (v2Res.ok) {
        const v2Data = await v2Res.json() as Record<string, unknown>;
        console.log('[Auth/Callback] v2 profile fields:', Object.keys(v2Data));
        userSub ??= (v2Data.id ?? v2Data.sub) as string | undefined;
        // Build full name from first_name + last_name if available
        const firstName = v2Data.first_name as string | undefined;
        const lastName = v2Data.last_name as string | undefined;
        if (!userName) {
          if (firstName || lastName) {
            userName = [firstName, lastName].filter(Boolean).join(' ');
          } else {
            userName = (v2Data.name ?? v2Data.full_name ?? v2Data.username ?? v2Data.preferred_username) as string | undefined;
          }
        }
        userEmail ??= v2Data.email as string | undefined;
        userPicture ??= (v2Data.picture ?? v2Data.profile_picture ?? v2Data.avatar) as string | undefined;
      } else {
        console.warn('[Auth/Callback] v2 profile returned:', v2Res.status, '— trying v1/me');
        // ── Try v1/me fallback ──────────────────────────────────────────────
        const v1Res = await fetch(`${qfConfig.apiBaseUrl}/auth/v1/me`, {
          headers: {
            'x-auth-token': tokens.access_token as string,
            'x-client-id': qfConfig.clientId,
          },
        });

        if (v1Res.ok) {
          const v1Data = await v1Res.json() as Record<string, unknown>;
          console.log('[Auth/Callback] v1 me fields:', Object.keys(v1Data));
          userSub ??= (v1Data.id ?? v1Data.sub) as string | undefined;
          const fn = v1Data.first_name as string | undefined;
          const ln = v1Data.last_name as string | undefined;
          if (!userName) {
            userName = fn || ln
              ? [fn, ln].filter(Boolean).join(' ')
              : (v1Data.name ?? v1Data.full_name ?? v1Data.given_name) as string | undefined;
          }
          userEmail ??= v1Data.email as string | undefined;
          userPicture ??= (v1Data.picture ?? v1Data.profile_picture) as string | undefined;
        } else {
          console.warn('[Auth/Callback] v1 me returned:', v1Res.status, '— trying /userinfo');
          // ── Final fallback: OIDC userinfo ──────────────────────────────────
          const uiRes = await fetch(`${qfConfig.authBaseUrl}/userinfo`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          if (uiRes.ok) {
            const ui = await uiRes.json();
            userSub ??= ui.sub;
            userEmail ??= ui.email;
            if (!userName) {
              const fn2 = ui.given_name as string | undefined;
              const ln2 = ui.family_name as string | undefined;
              userName = fn2 || ln2
                ? [fn2, ln2].filter(Boolean).join(' ')
                : (ui.name ?? ui.nickname ?? ui.preferred_username);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Auth/Callback] Profile fetch failed (non-critical):', err);
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
