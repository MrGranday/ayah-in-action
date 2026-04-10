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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Impact</h1>
        <PdfExportButton notes={notes} />
      </div>
      <ImpactDashboard notes={notes} />
    </div>
  );
}
