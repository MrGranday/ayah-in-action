'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { addApplicationNote, postActivityDay } from '@/lib/api';
import { getTypedSession } from '@/lib/session';
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
  type?: 'journal' | 'whisper';
  challenge?: string;
}) {
  const parsed = LogSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() };
  }

  const { verseKey, logText, categories, voiceTranscript } = parsed.data;
  const { type = 'journal', challenge } = formData;
  const session = await getTypedSession(await cookies());

  const accessToken = session.accessToken;
  if (!accessToken) {
    return { success: false, error: 'Not authenticated' };
  }

  const meta = JSON.stringify({
    v: 1,
    app: 'ayah-in-action',
    verseKey,
    categories,
    voiceTranscript: voiceTranscript ?? null,
    date: new Date().toLocaleDateString('en-CA'),
    type,
    challenge
  });

  const noteBody = `${logText}\n\n--- \n*Ayah in Action Archive* \n\`\`\`json\n${meta}\n\`\`\``;

  const [chapter, ayahNum] = verseKey.split(':');
  const range = `${chapter}:${ayahNum}-${chapter}:${ayahNum}`;

  try {
    const result = await addApplicationNote(accessToken, {
      body: noteBody,
      ranges: [range],
    });

    try {
      await postActivityDay(accessToken, {
        type: 'QURAN',
        seconds: 60,
        mushafId: 4, // 4 = Hafs (required by QF spec)
        ranges: [range],
      });
    } catch (activityErr) {
      // Best-effort — do not block note save if activity day fails
      console.warn('[Action] postActivityDay failed (non-blocking):', activityErr);
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
