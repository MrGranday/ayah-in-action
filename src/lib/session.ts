import { SessionOptions } from 'iron-session';
import type { SessionData } from '@/types/auth';

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

declare module 'iron-session' {
  interface IronSessionData {
    ayah: SessionData;
  }
}
