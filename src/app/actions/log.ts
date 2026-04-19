'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { addApplicationNote, postActivityDay } from '@/lib/api';
import { getTypedSession } from '@/lib/session';
import { generateEcho } from './generateEcho';
import type { Category } from '@/types/log';

const LogSchema = z.object({
  verseKey: z.string().regex(/^\d+:\d+$/),
  logText: z.string().min(1).max(5000), // Increased from 490 to 5000
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
  // Extra metadata for whispers
  arabic?: string;
  translation?: string;
  guidance?: string;
  reflection?: string;
}): Promise<{ success: boolean; noteId?: string; echo?: string; error?: any }> {
  const parsed = LogSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() };
  }

  const { verseKey, logText, categories, voiceTranscript } = parsed.data;
  const {
    type = 'journal',
    challenge,
    arabic,
    translation,
    guidance,
    reflection
  } = formData;
  const session = await getTypedSession(await cookies());

  const accessToken = session.accessToken;
  if (!accessToken) {
    return { success: false, error: 'Not authenticated' };
  }

  // ── Step 1: Try to generate an Echo (with 5-second timeout) ─────────────────
  let echo: string | undefined;
  try {
    const echoResult = await Promise.race([
      generateEcho({ logText, categories, verseKey }),
      new Promise<{ error: string }>((resolve) =>
        setTimeout(() => resolve({ error: 'timeout' }), 5000)
      ),
    ]);
    if ('echo' in echoResult && echoResult.echo) {
      echo = echoResult.echo;
    }
  } catch {
    // Non-blocking — echo failure never prevents saving the log
  }

  // ── Step 2: Build note metadata (with echo embedded) ────────────────────────
  const meta = JSON.stringify({
    v: 1,
    app: 'ayah-in-action',
    verseKey,       // Legacy compat
    verse_key: verseKey,
    categories,
    voiceTranscript: voiceTranscript ?? null,
    date: new Date().toLocaleDateString('en-CA'),
    type,
    challenge,
    // Whisper specific
    arabic,
    translation,
    guidance,
    reflection,
    // Echo of Application
    echo: echo ?? null,
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
    return { success: true, noteId: result.data?.id, echo };
  } catch (error) {
    console.error('Error saving application log:', error);
    return { success: false, error: 'Failed to save note' };
  }
}
