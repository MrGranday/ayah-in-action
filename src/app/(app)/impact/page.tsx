import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTypedSession } from '@/lib/session';
import { getAllNotes } from '@/lib/api';
import { ImpactDashboard } from '@/components/ImpactDashboard';
import { PdfExportButton } from '@/components/PdfExportButton';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Impact Dashboard',
  description: 'Visualize your consistency and the categories of your reflections.',
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

export default async function ImpactPage() {
  const cookieStore = await cookies();
  const session = await getTypedSession(cookieStore);
  
  const accessToken = session.accessToken;
  if (!accessToken) {
    redirect('/login');
  }

  const notes = await getNotes(accessToken || '');

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
