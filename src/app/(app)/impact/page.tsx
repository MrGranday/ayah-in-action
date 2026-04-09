import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
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
  const cookieStore = await cookies();
  const session = await getIronSession(cookieStore, sessionOptions);
  
  const accessToken = (session as any).accessToken;
  if (!accessToken) {
    redirect('/login');
  }

  const notes = await getNotes(accessToken || '');

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Impact</h1>
      <ImpactDashboard notes={notes} />
    </div>
  );
}
