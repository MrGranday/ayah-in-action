import { qfConfig } from './qf-config';

export interface Note {
  id: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function userApiFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {}
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second max timeout

  try {
    const res = await fetch(`${qfConfig.apiBaseUrl}/auth/v1${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': accessToken,
        'x-client-id': qfConfig.clientId,
        ...(options.headers ?? {}),
      },
    });

    clearTimeout(timeoutId);

    if (res.status === 401) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw new ApiError(res.status, `API error ${res.status}: ${errorText}`);
    }

    // Defensive check for headers (Next.js 16 environment)
    const contentType = res.headers && typeof res.headers.get === 'function' 
      ? res.headers.get('content-type') 
      : null;

    if (contentType?.includes('application/json')) {
      return res.json();
    }
    return res.text();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export interface NotePayload {
  body: string;
  ranges: string[];
  attachedEntities?: Array<{
    entityId: string;
    entityType: string;
    entityMetadata?: Record<string, unknown>;
  }>;
}

export interface NoteResponse {
  data?: {
    id: string;
  };
}

export async function addApplicationNote(
  accessToken: string,
  payload: NotePayload
): Promise<NoteResponse> {
  return userApiFetch('/notes', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAllNotes(
  accessToken: string,
  cursor?: string,
  limit = 20
): Promise<{ data: Note[] }> {
  const params = new URLSearchParams({ first: String(limit) });
  if (cursor) params.set('after', cursor);
  return userApiFetch(`/notes?${params}`, accessToken) as Promise<{ data: Note[] }>;
}

export async function getNotesByVerse(
  verseKey: string,
  accessToken: string
) {
  return userApiFetch(`/notes/verse/${verseKey}`, accessToken);
}

export async function updateNote(
  id: string,
  body: string,
  accessToken: string
) {
  return userApiFetch(`/notes/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ body }),
  });
}

export async function deleteNote(id: string, accessToken: string) {
  return userApiFetch(`/notes/${id}`, accessToken, { method: 'DELETE' });
}

export async function getCollections(accessToken: string) {
  return userApiFetch('/collections', accessToken);
}

export interface ActivityDayPayload {
  type: string;
  seconds: number;
  mushafId: number;
  ranges: string[];
}

export async function postActivityDay(
  accessToken: string,
  payload: ActivityDayPayload
) {
  return userApiFetch('/activity-days', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export { userApiFetch };
