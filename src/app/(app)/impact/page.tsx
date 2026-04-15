import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTypedSession } from '@/lib/session';
import { getAllNotes } from '@/lib/api';
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
        // Find the cursor for the next page (assuming the last note's id or similar if the API doesn't provide a specific cursor)
        // Note: The QF API typically uses the ID of the last element as the cursor for the next page.
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

  const { data: notes, error: notesError } = await getNotes(accessToken || '');

  if (notesError?.type === 'insufficient_scope' || notesError?.status === 403) {
    return (
      <div className="pt-12">
        <ScopeDoctor missingScopes={['note', 'activity_day']} />
      </div>
    );
  }

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
      
      <ImpactDashboard notes={notes} />
    </div>
  );
}
