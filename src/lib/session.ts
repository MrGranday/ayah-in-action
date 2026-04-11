import { SessionOptions, getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number;
  user?: {
    sub: string;
    name: string;
    email: string;
    picture?: string;
  };
  codeVerifier?: string;
  state?: string;
  nonce?: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production-must-be-32-chars',
  cookieName: 'ayah-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  },
};

/**
 * Gets the typed session from the cookie store.
 * @param cookieStore The cookie store (from cookies() call).
 */
export async function getTypedSession(cookieStore: any) {
  // Ensure we have a valid store
  const resolvedStore = await cookieStore;
  
  if (!resolvedStore || typeof resolvedStore.get !== 'function') {
    console.error('[Session] Invalid cookie store provided:', typeof resolvedStore);
    throw new Error('Invalid cookie store');
  }

  return await getIronSession<SessionData>(resolvedStore, sessionOptions);
}

/**
 * Specialized helper to get the session without passing the store (Server Components/Routes)
 */
export async function getServerSession() {
  return getTypedSession(await cookies());
}
