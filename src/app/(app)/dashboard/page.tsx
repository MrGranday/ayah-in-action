import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTypedSession } from '@/lib/session';
import { getAllNotes } from '@/lib/api';
import { hasLoggedOnDate, toLocalDate, parseNoteBody } from '@/lib/utils';
import { getQuranClient, getRandomChapter, getRandomVerse } from '@/lib/quran-sdk';
import { DailyGreeting } from '@/components/DailyGreeting';
import { AyahCard } from '@/components/AyahCard';
import { LogForm } from '@/components/LogForm';
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

async function getRandomAyah() {
  try {
    const client = getQuranClient();
    const chapterId = getRandomChapter();
    const chapter = await client.chapters.findById(chapterId as any);
    const versesCount = chapter.versesCount;
    const verseNum = getRandomVerse(chapterId, versesCount);
    
    const verse = await client.verses.findByKey(`${chapterId}:${verseNum}` as any, {
      translations: [131],
      audio: 1
    } as any);
    
    return {
      verse_key: verse.verseKey,
      chapter_id: chapterId,
      verse_number: verseNum,
      text_uthmani: verse.textUthmani || verse.textUthmaniSimple || '',
      translation: verse.translations?.[0]?.text || 'No translation available',
      tafsir_snippet: 'Reflect on this verse and consider how it applies to your daily life.',
      audio_url: verse.audio?.url || '',
      chapter_name_arabic: chapter.nameArabic,
      chapter_name_english: chapter.nameSimple,
    };
  } catch (err) {
    console.error('Failed to fetch ayah:', err);
    return FALLBACK_AYAH;
  }
}

async function getNotes(accessToken: string) {
  if (!accessToken) {
    return { data: [] };
  }
  try {
    const result = await getAllNotes(accessToken, undefined, 50);
    return result;
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return { data: [] };
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
    const notesResult = await getNotes(accessToken || '');
    const notes = Array.isArray(notesResult.data) ? notesResult.data : [];
    const today = toLocalDate(new Date());
    const hasLogged = hasLoggedOnDate(notes, today);

    let existingLogText = '';
    let existingCategories: string[] = [];
    let existingLogId = '';

    if (hasLogged) {
      const todayNote = notes.find((n: any) => {
        const date = n.createdAt || n.created_at ? new Date(n.createdAt || n.created_at).toLocaleDateString('en-CA') : 'Invalid Date';
        return date === today && n.body?.includes('<!--aia');
      });
      if (todayNote && typeof todayNote.body === 'string') {
        const { logText, metadata } = parseNoteBody(todayNote.body);
        existingLogText = logText;
        existingCategories = (metadata?.categories as string[]) || [];
        existingLogId = todayNote.id;
      }
    }

    const user = session.user;

    return (
      <div className="max-w-3xl mx-auto">
        <DailyGreeting user={user || null} />
        
        {ayah && <AyahCard ayah={ayah} />}
        
        <div className="mt-8">
          <LogForm
            hasLoggedToday={hasLogged}
            verseKey={ayah?.verse_key || '1:1'}
            existingLogText={existingLogText}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            existingCategories={existingCategories as any}
          />
        </div>
      </div>
    );
  } catch (error: any) {
    // CRITICAL: Next.js 'redirect()' throws a special Error under the hood. 
    // If you catch it and don't rethrow it, Next.js panics and throws a 500 Internal Server Error.
    if (error && typeof error === 'object' && 'digest' in error && typeof error.digest === 'string' && error.digest.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

    return (
      <div className="p-8 text-red-500">
        <h1 className="text-2xl font-bold mb-4">Error Rendering Dashboard</h1>
        <pre className="whitespace-pre-wrap">{error?.message || String(error)}</pre>
        <pre className="whitespace-pre-wrap mt-4">{error?.stack}</pre>
      </div>
    );
  }
}

