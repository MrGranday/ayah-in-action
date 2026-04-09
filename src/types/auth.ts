export interface SessionUser {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

export interface SessionData {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number;
  user?: SessionUser;
  codeVerifier?: string;
  state?: string;
  nonce?: string;
}

export interface QuranUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
}
