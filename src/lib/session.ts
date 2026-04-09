import { SessionOptions } from 'iron-session';

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
  password: process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production',
  cookieName: 'ayah-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  },
};

export async function getTypedSession(cookieStore: any) {
  return await getIronSession<SessionData>(cookieStore, sessionOptions);
}


