import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { getAllNotes } from '@/lib/api';
import { parseNoteBody } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

async function getNotes(accessToken: string) {
  try {
    const result = await getAllNotes(accessToken, undefined, 50);
    return result.data || [];
  } catch {
    return [];
  }
}

export default async function HistoryPage() {
  const cookieStore = await cookies();
  const session = await getIronSession(cookieStore, sessionOptions);
  
  const accessToken = (session as any).accessToken;
  if (!accessToken) {
    redirect('/login');
  }

  const notes = await getNotes(accessToken || '');
  const appNotes = notes
    .filter(n => n.body.includes('<!--aia'))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">History</h1>
      
      {appNotes.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {appNotes.map((note) => {
            const { logText, metadata } = parseNoteBody(note.body);
            const date = new Date(note.createdAt);
            const formattedDate = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            
            return (
              <div key={note.id} className="parchment p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-muted">{formattedDate}</span>
                  <Badge variant="gold">{metadata?.verseKey || 'Unknown'}</Badge>
                </div>
                <p className="text-text-primary mb-3">{logText}</p>
                <div className="flex flex-wrap gap-2">
                  {(metadata?.categories as string[] || []).map((cat) => (
                    <Badge key={cat} variant="secondary" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
