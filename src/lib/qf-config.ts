const ENV = process.env.QF_ENV === 'production' ? 'production' : 'prelive';

export const qfConfig = {
  env: ENV,
  clientId: process.env.QURAN_CLIENT_ID || '',
  clientSecret: process.env.QURAN_CLIENT_SECRET || '',
  authBaseUrl:
    ENV === 'production'
      ? 'https://oauth2.quran.foundation'
      : 'https://prelive-oauth2.quran.foundation',
  apiBaseUrl:
    ENV === 'production'
      ? 'https://apis.quran.foundation'
      : 'https://apis-prelive.quran.foundation',
  callbackUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback`,
};
