import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { getAllNotes } from '@/lib/api';
import { ImpactDashboard } from '@/components/ImpactDashboard';

export const dynamic = 'force-dynamic';

async function getNotes(accessToken: string) {
  try {
    const result = await getAllNotes(accessToken, undefined, 100);
    return result.data || [];
  } catch {
    return [];
  }
}

export default async function ImpactPage() {
  const session = await getIronSession({ cookies: () => Promise.resolve({}) } as any, sessionOptions);
  
  if (!session.accessToken) {
    redirect('/login');
  }

  const notes = await getNotes(session.accessToken || '');

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Impact</h1>
      <ImpactDashboard notes={notes} />
    </div>
  );
}
