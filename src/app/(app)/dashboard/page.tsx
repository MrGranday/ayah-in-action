import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTypedSession, sessionOptions } from '@/lib/session';
import { getAllNotes } from '@/lib/api';
import { hasLoggedOnDate, toLocalDate, parseNoteBody } from '@/lib/utils';
import { getQuranClient, getRandomChapter, getRandomVerse } from '@/lib/quran-sdk';
import { DailyGreeting } from '@/components/DailyGreeting';
import { AyahCard } from '@/components/AyahCard';
import { LogForm } from '@/components/LogForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Daily Ayah',
  description: 'Reflect on today\'s ayah and track your progress.',
};

export const dynamic = 'force-dynamic';

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
    return null;
  }
}

async function getNotes(accessToken: string) {
  try {
    const result = await getAllNotes(accessToken, undefined, 50);
    return result;
  } catch {
    return { data: [] };
  }
}

export default async function DashboardPage() {
  try {
    const cookieStore = await cookies();
    const session = await getTypedSession(cookieStore);
    
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
    return (
      <div className="p-8 text-red-500">
        <h1 className="text-2xl font-bold mb-4">Error Rendering Dashboard</h1>
        <pre className="whitespace-pre-wrap">{error?.message || String(error)}</pre>
        <pre className="whitespace-pre-wrap mt-4">{error?.stack}</pre>
      </div>
    );
  }
}

