import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTypedSession } from '@/lib/session';
import { getAllNotes } from '@/lib/api';
import { parseNoteBody, isAyahInActionNote } from '@/lib/utils';
import { HistoryClient } from '@/components/HistoryClient';
import { EmptyState } from '@/components/EmptyState';
import { Metadata } from 'next';
import { ScrollText } from 'lucide-react';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { ScopeDoctor } from '@/components/ScopeDoctor';

export const metadata: Metadata = {
  title: 'My Quran Journal',
  description: 'A timeline of your reflections and applications of the Quran.',
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getNotes(accessToken: string) {
  try {
    const result = await getAllNotes(accessToken, undefined, 100);
    return { data: result.data || [], error: null };
  } catch (error: any) {
    console.error('[History] Failed to fetch notes:', error);
    return { 
      data: [], 
      error: error instanceof ApiError ? { 
        status: error.status, 
        type: error.type 
      } : { status: 500 }
    };
  }
}

export default async function HistoryPage() {
  const cookieStore = await cookies();
  const session = await getTypedSession(cookieStore);

  const accessToken = session.accessToken;
  if (!accessToken) {
    redirect('/login');
  }

  const { data: rawNotes, error: notesError } = await getNotes(accessToken || '');

  if (notesError?.type === 'insufficient_scope' || notesError?.status === 403) {
    return (
      <div className="pt-12">
        <ScopeDoctor missingScopes={['notes', 'collections']} />
      </div>
    );
  }

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
        // ISO string, not Date object — Date is non-serializable across RSC boundary (React #130)
        date: new Date(note.createdAt || note.created_at || 0).toISOString(),
      };
    });

  if (appNotes.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="space-y-2 mb-12">
          <span className="font-label text-xs tracking-[0.3em] uppercase text-primary/40 font-bold">Chronology of Wisdom</span>
          <h1 className="font-serif text-5xl text-primary">The Archive</h1>
        </div>
        
        <div className="bg-white rounded-[2.5rem] p-12 md:p-20 border border-outline-variant/10 editorial-shadow parchment-texture text-center space-y-8">
          <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto ring-1 ring-primary/10">
             <ScrollText className="w-8 h-8 text-primary/20" />
          </div>
          
          <div className="space-y-4 max-w-sm mx-auto">
            <h2 className="font-serif text-3xl text-primary">The first entry awaits.</h2>
            <p className="font-body text-on-surface-variant leading-relaxed">
              Every legacy begins with a single reflection. Return to the Sanctuary to preserve your first moment of transcendence.
            </p>
          </div>

          <div className="pt-4">
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-3 px-8 h-14 rounded-2xl silk-gradient text-white font-label text-xs tracking-[0.2em] uppercase font-bold editorial-shadow hover:scale-[1.02] transition-transform"
            >
              Return to Sanctuary
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <HistoryClient notes={appNotes} />;
}
