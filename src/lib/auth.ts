import { qfConfig } from './qf-config';

const getCrypto = () => {
  if (typeof globalThis.crypto !== 'undefined') return globalThis.crypto;
  // Node.js fallback if not globally available (though it should be in v19+)
  try {
    return require('node:crypto').webcrypto;
  } catch {
    console.error('[Auth] Crypto not available in this environment');
    throw new Error('Crypto environment not initialized');
  }
};

export function generateRandomBytes(length: number): string {
  const crypto = getCrypto();
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function getAuthUrl(codeChallenge: string, state: string, nonce: string) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: qfConfig.clientId,
    redirect_uri: qfConfig.callbackUrl,
    scope: 'openid offline_access user collection',
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const url = `${qfConfig.authBaseUrl}/oauth2/auth?${params.toString()}`;
  return url;
}

export function getTokenUrl() {
  return `${qfConfig.authBaseUrl}/oauth2/token`;
}

export function getBasicAuthHeader() {
  const credentials = Buffer.from(
    `${qfConfig.clientId}:${qfConfig.clientSecret}`
  ).toString('base64');
  return `Basic ${credentials}`;
}

export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
