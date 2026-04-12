import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTypedSession } from '@/lib/session';
import { getAllNotes } from '@/lib/api';
import { hasLoggedOnDate, toLocalDate, parseNoteBody, isAyahInActionNote } from '@/lib/utils';
import { DailyGreeting } from '@/components/DailyGreeting';
import { AyahCard } from '@/components/AyahCard';
import { LogForm } from '@/components/LogForm';
import { ShuffleAyahButton } from '@/components/ShuffleAyahButton';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Your Daily Ayah',
  description: 'Reflect on today\'s ayah and track your progress.',
};

const FALLBACK_AYAH = {
  verse_key: '2:255',
  chapter_id: 2,
  verse_number: 255,
  text_uthmani: 'ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَيُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُۥ مَا فِي ٱلسَّمَٰوَٰتِ وَمَا فِي ٱلْأَرْضِ ۚ مَن ذَا ٱلَّذِي يَشْفَعُ عِندَهُۥ إِلَّا بِإِذْنِهِۥ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۚ وَلَا يُحِيطُونَ بِشَىْءٍ مِّنْ عِلْمِهِۥ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضَ ۚ وَلَا يَئُودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِيُّ ٱلْعَظِيمُ',
  translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is present before them and what is after them, and they encompass not a thing of His knowledge except for what He wills. His Throne extends over the heavens and the earth, and their preservation does not burden Him; and He is the Most High, the Most Great.',
  tafsir_snippet: 'This is Ayah al-Kursi, one of the greatest verses in the Quran. Reflect on Allah\'s names and attributes.',
  audio_url: '',
  chapter_name_arabic: 'البقرة',
  chapter_name_english: 'Al-Baqarah',
};

import { ScopeDoctor } from '@/components/ScopeDoctor';
import { ApiError } from '@/lib/api';

async function getRandomAyah() {
  try {
    /* 
     * [FIX: API 404 & React Error #130]
     * Why we are using native `fetch` instead of `@quranjs/api` SDK:
     * 1. The `@quranjs/api` SDK was attempting to authenticate with our `prelive-oauth2` server 
     *    using a client_credentials flow for this endpoint.
     * 2. Since `api.quran.com/api/v4` is a public API, sending an authenticated pre-live token 
     *    caused a 404/403 internal SDK error ("Token request failed: Not Found").
     * 3. This 404 error destabilized the Next.js SSR build on Vercel, returning a 500 error 
     *    payload to the browser during redirect.
     * 4. The browser router crashed trying to parse the 500 error payload into React components,
     *    resulting in the vague `Minified React error #130` on the client.
     * 
     * By using direct fetch(), we sidestep the OAuth SDK completely and reliably fetch 
     * the static public data without crashing the server.
     */
    const chapterId = Math.floor(Math.random() * 114) + 1;
    
    // Fetch chapter info for verse count
    const chapRes = await fetch(`https://api.quran.com/api/v4/chapters/${chapterId}`, { cache: 'no-store' });
    if (!chapRes.ok) throw new Error("Chapters API failed");
    const chapData = await chapRes.json();
    const versesCount = chapData.chapter.verses_count;
    
    const verseNum = Math.floor(Math.random() * versesCount) + 1;
    
    // Translation 131 is Clear Quran English, 20 is Sahih International (fallback). Audio 1 is Mishari Alafasy.
    const verseRes = await fetch(`https://api.quran.com/api/v4/verses/by_key/${chapterId}:${verseNum}?translations=131,20&audio=1&fields=text_uthmani,text_uthmani_simple`, { cache: 'no-store' });
    if (!verseRes.ok) throw new Error("Verses API failed");
    const verseData = await verseRes.json();
    const verse = verseData.verse;

    return {
      verse_key: verse.verse_key,
      chapter_id: chapterId,
      verse_number: verseNum,
      text_uthmani: String(verse.text_uthmani || verse.text_uthmani_simple || ''),
      translation: String(verse.translations?.[0]?.text || 'No translation available').replace(/<[^>]*>?/gm, ''),
      tafsir_snippet: 'Reflect on this verse and consider how it applies to your daily life.',
      audio_url: verse.audio?.url ? (verse.audio.url.startsWith('http') ? verse.audio.url : `https://verses.quran.com/${verse.audio.url}`) : '',
      chapter_name_arabic: String(chapData.chapter.name_arabic || ''),
      chapter_name_english: String(chapData.chapter.name_simple || ''),
    };
  } catch (err) {
    console.error('Failed to fetch ayah natively:', err);
    return FALLBACK_AYAH;
  }
}

async function getNotes(accessToken: string) {
  if (!accessToken) {
    return { data: [], error: null };
  }
  try {
    const result = await getAllNotes(accessToken, undefined, 50);
    return { data: result.data || [], error: null };
  } catch (error: any) {
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
  try {
    let cookieStore;
    try {
      cookieStore = await cookies();
    } catch (cookieError) {
      console.error('[Dashboard] Failed to get cookies:', cookieError);
      return (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Session Error</h1>
          <p className="text-text-muted">Unable to access session. Please try logging in again.</p>
          <a href="/login" className="text-emerald hover:underline mt-4 block">Go to Login</a>
        </div>
      );
    }

    let session;
    try {
      session = await getTypedSession(cookieStore);
    } catch (sessionError) {
      console.error('[Dashboard] Failed to load session:', sessionError);
      return (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Session Error</h1>
          <p className="text-text-muted">Unable to load your session.</p>
        </div>
      );
    }
    
    const accessToken = session.accessToken;
    if (!accessToken) {
      redirect('/login');
    }

    const ayah = await getRandomAyah();
    const { data: notes, error: notesError } = await getNotes(accessToken || '');

    if (notesError?.type === 'insufficient_scope' || notesError?.status === 403) {
      return (
        <div className="pt-12">
           <ScopeDoctor missingScopes={['notes', 'collections']} />
        </div>
      );
    }

    const today = toLocalDate(new Date());

    let existingLogText = '';
    let existingCategories: string[] = [];
    let existingLogId = '';

    const todayNote = notes.find((n: any) => {
      const date = n.createdAt || n.created_at ? new Date(n.createdAt || n.created_at).toLocaleDateString('en-CA') : 'Invalid Date';
      if (date !== today || !isAyahInActionNote(n)) return false;
      const { metadata } = parseNoteBody(n.body);
      return metadata?.verseKey === ayah?.verse_key;
    });

    const hasLoggedThisAyah = !!todayNote;

    if (hasLoggedThisAyah && todayNote && typeof todayNote.body === 'string') {
      const { logText, metadata } = parseNoteBody(todayNote.body);
      existingLogText = logText;
      existingCategories = (metadata?.categories as string[]) || [];
      existingLogId = todayNote.id;
    }

    const user = session.user;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="mb-10">
          <DailyGreeting user={user || null} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Divine Wisdom (Ayah) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <span className="font-label text-[10px] tracking-[0.4em] uppercase text-primary/40 block">Today&apos;s Sanctuary</span>
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
  } catch (error: any) {
    // CRITICAL: Next.js 'redirect()' throws a special Error under the hood. 
    // If you catch it and don't rethrow it, Next.js panics and throws a 500 Internal Server Error.
    if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

    console.error('[Dashboard] Render Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return (
      <div className="p-8 text-red-500">
        <h1 className="text-2xl font-bold mb-4">Error Rendering Dashboard</h1>
        <p className="mb-4">The dashboard failed to load. Check the server logs for detailed trace.</p>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{errorMessage}</pre>
      </div>
    );
  }
}

