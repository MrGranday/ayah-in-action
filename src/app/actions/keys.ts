'use server';

import { getServerSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function saveApiKeys(data: { 
  claudeKey?: string; 
  openaiKey?: string; 
  preferredModel?: 'claude' | 'gpt4o';
}) {
  const session = await getServerSession();
  
  if (data.claudeKey !== undefined) session.claudeKey = data.claudeKey;
  if (data.openaiKey !== undefined) session.openaiKey = data.openaiKey;
  if (data.preferredModel !== undefined) session.preferredModel = data.preferredModel;
  
  await session.save();
  revalidatePath('/settings');
  revalidatePath('/whisper');
  return { success: true };
}

export async function clearApiKeys() {
  const session = await getServerSession();
  session.claudeKey = undefined;
  session.openaiKey = undefined;
  await session.save();
  revalidatePath('/settings');
  revalidatePath('/whisper');
  return { success: true };
}

export async function getApiKeyStatus() {
  const session = await getServerSession();
  return {
    hasClaude: !!session.claudeKey,
    hasOpenAI: !!session.openaiKey,
    preferredModel: session.preferredModel || 'claude'
  };
}
