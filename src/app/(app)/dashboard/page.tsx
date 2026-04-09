import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { getAllNotes } from '@/lib/api';
import { hasLoggedOnDate, toLocalDate, parseNoteBody } from '@/lib/utils';
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ayah/random`, {
      cache: 'no-store',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // ignore
  }
  return null;
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
  const cookieStore = await cookies();
  const session = await getIronSession(cookieStore, sessionOptions);
  
  const accessToken = (session as any).accessToken;
  if (!accessToken) {
    redirect('/login');
  }

  const ayah = await getRandomAyah();
  const notesResult = await getNotes(accessToken || '');
  const notes = notesResult.data || [];
  const today = toLocalDate(new Date());
  const hasLogged = hasLoggedOnDate(notes, today);

  let existingLogText = '';
  let existingCategories: string[] = [];
  let existingLogId = '';

  if (hasLogged) {
    const todayNote = notes.find(n => {
      const date = new Date(n.createdAt).toLocaleDateString('en-CA');
      return date === today && n.body.includes('<!--aia');
    });
    if (todayNote) {
      const { logText, metadata } = parseNoteBody(todayNote.body);
      existingLogText = logText;
      existingCategories = (metadata?.categories as string[]) || [];
      existingLogId = todayNote.id;
    }
  }

  const user = (session as any).user;

  return (
    <div className="max-w-3xl mx-auto">
      <DailyGreeting user={user || null} />
      
      {ayah && <AyahCard ayah={ayah} />}
      
      <div className="mt-8">
        <LogForm
          hasLoggedToday={hasLogged}
          verseKey={ayah?.verse_key || '1:1'}
          existingLogText={existingLogText}
          existingCategories={existingCategories as any}
          existingLogId={existingLogId}
        />
      </div>
    </div>
  );
}
