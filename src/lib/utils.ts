import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toLocalDate(d: Date): string {
  return d.toLocaleDateString('en-CA');
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
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

export function isAyahInActionNote(note: { body: string }): boolean {
  return note.body.includes('<!--aia');
}

import type { NoteMetadata } from '@/types/log';

export function parseNoteBody(body: string): {
  logText: string;
  metadata: NoteMetadata | null;
} {
  try {
    const match = body.match(/<!--aia\n({.*?})\naia-->/s);
    if (match) {
      const metadata = JSON.parse(match[1]);
      const logText = body.split('\n<!--aia')[0].trim();
      return { logText, metadata };
    }
  } catch {
    // fall through to default
  }
  return { logText: body, metadata: null };
}

export function computeAppStreak(
  notes: Array<any>
): number {
  const appNotes = notes.filter(n => n?.body && isAyahInActionNote(n));

  const validAppNotes = appNotes.filter(n => n.createdAt || n.created_at);
  const dates = [...new Set(validAppNotes.map((n) => toLocalDate(new Date(n.createdAt || n.created_at))))].sort().reverse();

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
  notes: Array<any>,
  date: string
): boolean {
  return notes.filter(n => n?.body && isAyahInActionNote(n)).some(
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
