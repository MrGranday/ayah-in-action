import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { getAuthUrl, generateRandomBytes } from '@/lib/auth';
import { sha256hash } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const session = await getIronSession(request.cookies, sessionOptions);

  const codeVerifier = generateRandomBytes(32);
  const codeChallenge = await sha256hash(codeVerifier);
  const state = generateRandomBytes(16);
  const nonce = generateRandomBytes(16);

  session.codeVerifier = codeVerifier;
  session.state = state;
  session.nonce = nonce;
  await session.save();

  const authUrl = getAuthUrl(codeChallenge, state, nonce);
  
  return NextResponse.redirect(authUrl);
}
