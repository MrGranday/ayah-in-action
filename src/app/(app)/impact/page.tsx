import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTypedSession } from '@/lib/session';
import { getAllNotes, getActivityDays } from '@/lib/api';
import { ImpactDashboard } from '@/components/ImpactDashboard';
import { PdfExportButton } from '@/components/PdfExportButton';
import { Metadata } from 'next';
import { ApiError } from '@/lib/api';
import { ScopeDoctor } from '@/components/ScopeDoctor';

export const metadata: Metadata = {
  title: 'My Impact Dashboard',
  description: 'Visualize your consistency and the categories of your reflections.',
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getNotes(accessToken: string) {
  try {
    // Stage 1: Fetch the first 50 notes
    const result1 = await getAllNotes(accessToken, undefined, 50);
    const notes = [...(result1.data || [])];
    
    // Stage 2: If we hit the limit, fetch the next 50 for better trend visualization
    if (notes.length === 50) {
      try {
        const cursor = notes[notes.length - 1].id;
        const result2 = await getAllNotes(accessToken, cursor, 50);
        notes.push(...(result2.data || []));
      } catch (pagiError) {
        console.warn('[Impact] Pagination fetch failed (non-blocking):', pagiError);
      }
    }

    return { data: notes, error: null };
  } catch (error: any) {
    console.error('[Impact] Failed to fetch notes:', error);
    return { 
      data: [], 
      error: error instanceof ApiError ? { 
        status: error.status, 
        type: error.type 
      } : { status: 500 }
    };
  }
}

export default async function ImpactPage() {
  const cookieStore = await cookies();
  const session = await getTypedSession(cookieStore);
  
  const accessToken = session.accessToken;
  if (!accessToken) {
    redirect('/login');
  }

  // Fetch notes and activity days in parallel
  const [{ data: notes, error: notesError }, activityDaysResult] = await Promise.all([
    getNotes(accessToken || ''),
    getActivityDays(accessToken || '').catch((err) => {
      console.warn('[Impact] Could not fetch activity days (non-blocking):', err);
      return { data: [] };
    }),
  ]);

  if (notesError?.type === 'insufficient_scope' || notesError?.status === 403) {
    return (
      <div className="pt-12">
        <ScopeDoctor missingScopes={['note', 'activity_day']} />
      </div>
    );
  }

  // Build heatmap values: merge AIA note dates + QF activity day dates
  // This gives true two-way sync on the heatmap
  const noteDateCounts: Record<string, number> = {};
  notes.forEach((n: any) => {
    const ts = n.createdAt || n.created_at;
    if (ts) {
      const key = new Date(ts).toLocaleDateString('en-CA');
      noteDateCounts[key] = (noteDateCounts[key] || 0) + 1;
    }
  });

  // Activity days from QF (includes Quran.com sessions) — each day = 1 activity
  const activityDates = new Set<string>();
  (activityDaysResult.data || []).forEach((day: any) => {
    // QF returns date as 'YYYY-MM-DD' directly
    if (day.date) activityDates.add(day.date);
    else if (day.createdAt) activityDates.add(new Date(day.createdAt).toLocaleDateString('en-CA'));
  });

  // Merge: heatmap cell = max(notes on date, 1 if activity day exists)
  const allDates = new Set([...Object.keys(noteDateCounts), ...activityDates]);
  const heatmapValues = Array.from(allDates).map(date => ({
    date,
    count: Math.max(noteDateCounts[date] || 0, activityDates.has(date) ? 1 : 0),
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
        <div className="space-y-2">
          <span className="font-label text-xs tracking-[0.3em] uppercase text-primary/40 font-bold">Spiritual Progress</span>
          <h1 className="font-serif text-5xl text-primary">The Influence</h1>
          <p className="font-body text-on-surface-variant max-w-md italic">
            Visualizing the ripples of change created by your daily commitment to the Word.
          </p>
        </div>
        <div className="shrink-0">
          <PdfExportButton notes={notes} />
        </div>
      </div>
      
      <ImpactDashboard notes={notes} heatmapValues={heatmapValues} />
    </div>
  );
}
