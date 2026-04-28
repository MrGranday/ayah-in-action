import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTypedSession } from '@/lib/session';
import { getAllNotes, type Note } from '@/lib/api';
import { toLocalDate, isAyahInActionNote, parseNoteBody } from '@/lib/utils';
import { DailyGreeting } from '@/components/DailyGreeting';
import { AyahCard } from '@/components/AyahCard';
import { LogForm } from '@/components/LogForm';
import { ShuffleAyahButton } from '@/components/ShuffleAyahButton';
import { Metadata } from 'next';
import { t } from '@/lib/i18n/uiStrings';
import { ScopeDoctor } from '@/components/ScopeDoctor';
import { ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Your Daily Ayah',
  description: 'Reflect on today\'s ayah and track your progress.',
};

async function getNotes(accessToken: string) {
  if (!accessToken) return { data: [], error: null };
  try {
    const result = await getAllNotes(accessToken, undefined, 50);
    return { data: result.data || [], error: null };
  } catch (error: unknown) {
    console.error('Failed to fetch notes:', error);
    return {
      data: [],
      error: error instanceof ApiError ? {
        status: error.status,
        type: error.type,
        message: error.message
      } : { status: 500, message: String(error) }
    };
  }
}

export default async function DashboardPage() {
  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch (cookieError) {
    console.error('[Dashboard] Failed to get cookies:', cookieError);
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">{t('error', 'en')}</h1>
        <p className="text-text-muted">{t('unableToAccessSession', 'en')}</p>
        <a href="/login" className="text-emerald hover:underline mt-4 block">{t('goToLogin', 'en')}</a>
      </div>
    );
  }

  try {
    let session;
    try {
      session = await getTypedSession(cookieStore);
    } catch (sessionError) {
      console.error('[Dashboard] Failed to load session:', sessionError);
      return (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('error', 'en')}</h1>
          <p className="text-text-muted">{t('unableToLoadSession', 'en')}</p>
        </div>
      );
    }

    const accessToken = session.accessToken;
    if (!accessToken) {
      redirect('/login');
    }

    const isoCode = session.isoCode || 'en';
    
    // Use the centralized fetchVerse utility for consistency
    const { fetchVerse } = await import('@/lib/quran/fetchVerse');
    const chapterId = Math.floor(Math.random() * 114) + 1;
    const chapRes = await fetch(`https://api.quran.com/api/v4/chapters/${chapterId}?language=${isoCode}`, { cache: 'no-store' });
    const chapData = await chapRes.json();
    const versesCount = chapData.chapter.verses_count;
    const verseNum = Math.floor(Math.random() * versesCount) + 1;
    
    const verseData = await fetchVerse(`${chapterId}:${verseNum}`, isoCode);
    const verse = verseData.verse;

    const ayah = {
      verse_key: verse.verse_key,
      chapter_id: chapterId,
      verse_number: verseNum,
      text_uthmani: String(verse.text_uthmani || ''),
      translation: String(verse.translations?.[0]?.text || 'No translation available').replace(/<[^>]*>?/gm, ''),
      tafsir_snippet: t('sourceAyah', isoCode),
      audio_url: verse.audio?.url ? (verse.audio.url.startsWith('http') ? verse.audio.url : `https://verses.quran.com/${verse.audio.url}`) : '',
      chapter_name_arabic: String(chapData.chapter.name_arabic || ''),
      chapter_name_english: String(chapData.chapter.name_simple || ''),
    };

    const { data: notes, error: notesError } = await getNotes(accessToken || '');

    if (notesError?.type === 'insufficient_scope' || notesError?.status === 403) {
      return (
        <div className="pt-12">
          <ScopeDoctor missingScopes={['note', 'activity_day']} />
        </div>
      );
    }

    const today = toLocalDate(new Date());

    let existingLogText = '';
    let existingCategories: string[] = [];

    const todayNote = notes.find((n: Note) => {
      const timestamp = n.createdAt || n.created_at;
      const date = timestamp ? new Date(timestamp).toLocaleDateString('en-CA') : 'Invalid Date';
      if (date !== today || !isAyahInActionNote(n)) return false;
      const { metadata } = parseNoteBody(n.body);
      return metadata?.verseKey === ayah?.verse_key;
    });

    const hasLoggedThisAyah = !!todayNote;

    if (hasLoggedThisAyah && todayNote && typeof todayNote.body === 'string') {
      const { logText, metadata } = parseNoteBody(todayNote.body);
      existingLogText = logText;
      existingCategories = (metadata?.categories as string[]) || [];
    }

    const user = session.user;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mb-6">
          <DailyGreeting user={user || null} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Divine Wisdom (Ayah) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-label text-[10px] tracking-[0.4em] uppercase text-primary/40 block">{t('todaysSanctuary', isoCode)}</span>
              <ShuffleAyahButton />
            </div>
            {ayah && <AyahCard ayah={ayah} />}
          </div>

          {/* Right Column: Capture & Archive */}
          <div className="lg:pt-10">
            <LogForm
              hasLoggedToday={hasLoggedThisAyah}
              verseKey={ayah?.verse_key || '1:1'}
              existingLogText={existingLogText}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              existingCategories={existingCategories as any}
            />
          </div>
        </div>
      </div>
    );
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('[Dashboard] Render Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const session = await getTypedSession(cookieStore);
    const isoCode = session?.isoCode || 'en';
    
    return (
      <div className="p-8 text-center text-red-500">
        <h1 className="text-2xl font-bold mb-4">{t('error', isoCode)}</h1>
        <p className="mb-4">{t('failedToLoadDashboard', isoCode)}</p>
        <pre className="bg-surface-container p-4 rounded text-xs overflow-auto max-w-md mx-auto">{errorMessage}</pre>
      </div>
    );
  }
}
