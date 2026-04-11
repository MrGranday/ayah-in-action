import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTypedSession } from '@/lib/session';
import { getAllNotes } from '@/lib/api';
import { parseNoteBody, isAyahInActionNote } from '@/lib/utils';
import { HistoryClient } from '@/components/HistoryClient';
import { EmptyState } from '@/components/EmptyState';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Quran Journal',
  description: 'A timeline of your reflections and applications of the Quran.',
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getNotes(accessToken: string) {
  try {
    const result = await getAllNotes(accessToken, undefined, 100);
    return result.data || [];
  } catch {
    return [];
  }
}

export default async function HistoryPage() {
  const cookieStore = await cookies();
  const session = await getTypedSession(cookieStore);

  const accessToken = session.accessToken;
  if (!accessToken) {
    redirect('/login');
  }

  const rawNotes = await getNotes(accessToken || '');

  const appNotes = rawNotes
    .filter((n: any) => isAyahInActionNote(n))
    .sort(
      (a: any, b: any) => {
        const da = new Date(a.createdAt || a.created_at || 0).getTime();
        const db = new Date(b.createdAt || b.created_at || 0).getTime();
        return db - da;
      }
    )
    .map((note: any) => {
      const { logText, metadata } = parseNoteBody(note.body);
      return {
        id: note.id,
        logText,
        metadata,
        date: new Date(note.createdAt || note.created_at || 0),
      };
    });

  if (appNotes.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--color-text-primary)' }}>
          My Journal
        </h1>
        <div
          className="parchment p-12"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <EmptyState
            title="No applications yet…"
            description="The first one always feels special. Head to the Dashboard and log today's ayah."
          />
        </div>
      </div>
    );
  }

  return <HistoryClient notes={appNotes} />;
}
