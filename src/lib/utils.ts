import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toLocalDate(d: Date): string {
  return d.toLocaleDateString('en-CA');
}

export function formatDate(date: Date, isoCode: string = 'en'): string {
  // Map ISO codes to BCP 47 locales if needed, though they usually match
  return new Intl.DateTimeFormat(isoCode, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}


export async function sha256hash(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  let binary = '';
  for (let i = 0; i < hashArray.byteLength; i++) {
    binary += String.fromCharCode(hashArray[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function isAyahInActionNote(note: { body?: string }): boolean {
  if (!note?.body) return false;
  return note.body.includes('<!--aia') || note.body.includes('*Ayah in Action Archive*') || note.body.includes('AIA_META:');
}

import type { NoteMetadata } from '@/types/log';

type ParsedNote = {
  logText: string;
  metadata: NoteMetadata | null;
};

export function parseNoteBody(body: string): ParsedNote {
  if (!body || typeof body !== 'string') return { logText: '', metadata: null };
  
  try {
    // 1. Newest syntax (fastest)
    if (body.includes('AIA_META:')) {
      const lines = body.split('\n');
      const metadataLine = lines.find(l => l.startsWith('AIA_META:'));
      if (metadataLine) {
        const jsonStr = metadataLine.replace('AIA_META:', '');
        const metadata = JSON.parse(jsonStr) as NoteMetadata;
        const logText = lines.filter(l => !l.startsWith('AIA_META:')).join('\n').trim();
        return { logText, metadata };
      }
    }

    // 2. HTML comment syntax (legacy)
    const matchOld = body.match(/<!--aia\n({.*?})\naia-->/s);
    if (matchOld) {
      const metadata = JSON.parse(matchOld[1]) as NoteMetadata;
      const logText = body.split('\n<!--aia')[0].trim();
      return { logText, metadata };
    }

    // 3. Markdown footer syntax (legacy)
    const matchNew = body.match(/--- \n\*Ayah in Action Archive\* \n```json\n({.*?})\n```/s);
    if (matchNew) {
      const metadata = JSON.parse(matchNew[1]) as NoteMetadata;
      const logText = body.split('\n--- \n*Ayah')[0].trim();
      return { logText, metadata };
    }
  } catch (e) {
    console.warn('[parseNoteBody] Failed to parse metadata:', e);
  }

  return { logText: body, metadata: null };
}

export function computeAppStreak(
  notes: Array<{ body?: string; createdAt?: string; created_at?: string }>
): number {
  const appNotes = notes.filter(n => isAyahInActionNote(n));

  const validAppNotes = appNotes.filter(n => n.createdAt || n.created_at);
  const dates = [...new Set(validAppNotes.map((n) => toLocalDate(new Date(n.createdAt || n.created_at!))))].sort().reverse();

  if (dates.length === 0) return 0;

  const today = toLocalDate(new Date());
  const yesterday = toLocalDate(new Date(Date.now() - 86400000));

  if (dates[0] !== today && dates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

export function hasLoggedOnDate(
  notes: Array<{ body?: string; createdAt?: string; created_at?: string }>,
  date: string
): boolean {
  return notes.filter(n => isAyahInActionNote(n)).some(
    (n) => {
      const ts = n.createdAt || n.created_at;
      if (!ts) return false;
      try {
        return toLocalDate(new Date(ts)) === date;
      } catch {
        return false;
      }
    }
  );
}
