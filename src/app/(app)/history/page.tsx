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

export default async function HistoryPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ month?: string; year?: string; limit?: string }> 
}) {
  const params = await searchParams;
  const month = params.month;
  const year = params.year;
  const limit = parseInt(params.limit || '20');
  
  // If filtering by month we need a larger chunk
  const fetchLimit = month ? 100 : limit;

  const cookieStore = await cookies();
  const session = await getTypedSession(cookieStore);

  const accessToken = session.accessToken;
  if (!accessToken) {
    redirect('/login');
  }

  const { data: rawNotes, error: notesError } = await getAllNotes(accessToken || '', undefined, fetchLimit)
    .then(res => ({ data: res.data || [], error: null }))
    .catch((error: any) => ({
      data: [],
      error: error instanceof ApiError ? { status: error.status, type: error.type } : { status: 500 }
    }));

  if (notesError?.type === 'insufficient_scope' || notesError?.status === 403) {
    return (
      <div className="pt-12">
        <ScopeDoctor missingScopes={['note', 'activity_day']} />
      </div>
    );
  }

  // Sort all notes newest-first
  const sortedNotes = [...rawNotes].sort((a: any, b: any) => {
    const da = new Date(a.createdAt || a.created_at || 0).getTime();
    const db = new Date(b.createdAt || b.created_at || 0).getTime();
    return db - da;
  });

  // ── AIA notes: parse metadata ───────────────────────────────────────────────
  const aiaNotesRaw = sortedNotes
    .filter((n: any) => isAyahInActionNote(n))
    .map((note: any) => {
      const { logText, metadata } = parseNoteBody(note.body);
      return {
        id: note.id,
        logText,
        metadata,
        source: 'aia' as const,
        date: new Date(note.createdAt || note.created_at || 0).toISOString(),
      };
    });

  // ── QF-native notes: show as-is (two-way sync) ─────────────────────────────
  const qfNotesRaw = sortedNotes
    .filter((n: any) => !isAyahInActionNote(n))
    .map((note: any) => ({
      id: note.id,
      logText: note.body,
      metadata: null,
      source: 'qf' as const,
      date: new Date(note.createdAt || note.created_at || 0).toISOString(),
    }));

  // ── Fetch verse text for AIA notes ─────────────────────────────────────────
  const uniqueVerseKeys = [
    ...new Set(
      aiaNotesRaw.map((n: any) => n.metadata?.verse_key || n.metadata?.verseKey).filter(Boolean)
    )
  ];
  
  const fetchedVerses: Record<string, { arabic: string; translation: string }> = {};

  const translationId = session.translationResourceId || 131;

  if (uniqueVerseKeys.length > 0) {
    await Promise.all(
      uniqueVerseKeys.map(async (key) => {
        try {
          const res = await fetch(`https://api.quran.com/api/v4/verses/by_key/${key}?translations=${translationId},20&fields=text_uthmani,text_uthmani_simple`, {
            next: { revalidate: 86400 }
          });
          if (res.ok) {
            const data = await res.json();
            const verse = data.verse;
            fetchedVerses[key as string] = {
              arabic: String(verse.text_uthmani || verse.text_uthmani_simple || ''),
              translation: String(verse.translations?.[0]?.text || '').replace(/<[^>]*>?/gm, '')
            };
          }
        } catch {
          // fail silently
        }
      })
    );
  }

  // Attach verse text to AIA notes
  const aiaNotesWithVerses = aiaNotesRaw.map((note: any) => {
    const vKey = note.metadata?.verse_key || note.metadata?.verseKey;
    return {
      ...note,
      ayahTextArabic: vKey ? fetchedVerses[vKey]?.arabic || null : null,
      ayahTextTranslation: vKey ? fetchedVerses[vKey]?.translation || null : null,
    };
  });

  // QF notes don't have verse data in this context
  const qfNotesWithVerses = qfNotesRaw.map((note: any) => ({
    ...note,
    ayahTextArabic: null,
    ayahTextTranslation: null,
  }));

  // Merge: AIA notes + QF notes, sorted by date
  const allNotes = [...aiaNotesWithVerses, ...qfNotesWithVerses].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  if (allNotes.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="space-y-2 mb-12">
          <span className="font-label text-xs tracking-[0.3em] uppercase text-primary/40 font-bold">Chronology of Wisdom</span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-primary">The Archive</h1>
        </div>
        
        <div className="bg-white rounded-[2.5rem] p-12 md:p-20 border border-outline-variant/10 editorial-shadow parchment-texture text-center space-y-8">
          <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto ring-1 ring-primary/10">
             <ScrollText className="w-8 h-8 text-primary/20" />
          </div>
          
          <div className="space-y-4 max-w-sm mx-auto">
            <h2 className="font-serif text-2xl md:text-3xl text-primary">The first entry awaits.</h2>
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

  return <HistoryClient notes={allNotes} />;
}
