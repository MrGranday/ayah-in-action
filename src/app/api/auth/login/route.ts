import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTypedSession } from '@/lib/session';
import { getAuthUrl, generateRandomBytes } from '@/lib/auth';
import { sha256hash } from '@/lib/utils';

export async function GET(request: NextRequest) {
  console.log('[Auth] Initiating login flow...');
  
  const cookieStore = await cookies();
  const session = await getTypedSession(cookieStore);

  try {
    const codeVerifier = generateRandomBytes(32);
    const codeChallenge = await sha256hash(codeVerifier);
    const state = generateRandomBytes(16);
    const nonce = generateRandomBytes(16);

    session.codeVerifier = codeVerifier;
    session.state = state;
    session.nonce = nonce;
    await session.save();

    const forceConsent = request.nextUrl.searchParams.get('force_consent') === 'true';
    const authUrl = getAuthUrl(codeChallenge, state, nonce, forceConsent);
    console.log('[Auth] Redirecting to:', authUrl, forceConsent ? '(force_consent)' : '');
    
    // Use the native redirect() from next/navigation
    redirect(authUrl);
  } catch (error: any) {
    if (error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw Next.js redirect errors
    }
    
    console.error('[Auth] Login initialization failed:', error);
    // Redirect back to login with error
    redirect(`/login?error=init_failed&msg=${encodeURIComponent(error.message)}`);
  }
}
