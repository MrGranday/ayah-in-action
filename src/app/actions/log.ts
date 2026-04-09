'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { revalidatePath } from 'next/cache';
import { addApplicationNote, postActivityDay } from '@/lib/api';
import { sessionOptions } from '@/lib/session';
import type { Category } from '@/types/log';

const LogSchema = z.object({
  verseKey: z.string().regex(/^\d+:\d+$/),
  logText: z.string().min(1).max(490),
  categories: z.array(z.string()).min(1).max(10),
  voiceTranscript: z.string().max(1500).optional(),
});

export async function saveApplicationLog(formData: {
  verseKey: string;
  logText: string;
  categories: Category[];
  voiceTranscript?: string;
}) {
  const parsed = LogSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() };
  }

  const { verseKey, logText, categories, voiceTranscript } = parsed.data;
  const session = await getIronSession(await cookies(), sessionOptions);

  if (!session.accessToken) {
    return { success: false, error: 'Not authenticated' };
  }

  const meta = JSON.stringify({
    v: 1,
    app: 'ayah-in-action',
    verseKey,
    categories,
    voiceTranscript: voiceTranscript ?? null,
    date: new Date().toLocaleDateString('en-CA'),
  });

  const noteBody = `${logText}\n<!--aia\n${meta}\naia-->`;

  const [chapter, ayahNum] = verseKey.split(':');
  const range = `${chapter}:${ayahNum}-${chapter}:${ayahNum}`;

  try {
    const result = await addApplicationNote(session.accessToken, {
      body: noteBody,
      ranges: [range],
      attachedEntities: [
        {
          entityId: verseKey,
          entityType: 'reflection',
          entityMetadata: {
            categories,
            voiceTranscript: voiceTranscript ?? null,
            verseKey,
            appVersion: '1.0',
          },
        },
      ],
    });

    try {
      await postActivityDay(session.accessToken, {
        type: 'QURAN',
        seconds: 60,
        mushafId: 1,
        ranges: [range],
      });
    } catch {
      // Silent ignore - streak bonus is best-effort
    }

    revalidatePath('/dashboard');
    revalidatePath('/impact');
    revalidatePath('/history');
    return { success: true, noteId: result.data?.id };
  } catch (error) {
    console.error('Error saving application log:', error);
    return { success: false, error: 'Failed to save note' };
  }
}
