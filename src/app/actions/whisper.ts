'use server';

import { ProcessedVerse } from '@/types/quran';

/**
 * [LIFE WHISPER]
 * Calls the official Quran Foundation MCP semantic search endpoint.
 * This translates a life challenge (text) into a relevant Ayah reference.
 */
export async function suggestAyahFromChallenge(challenge: string): Promise<ProcessedVerse | null> {
  if (!challenge || challenge.trim().length < 3) return null;

  try {
    // 1. Call MCP Semantic Search
    // Assuming the endpoint accepts a JSON body with the query.
    const searchRes = await fetch('https://mcp.quran.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: challenge }),
    });

    if (!searchRes.ok) {
      console.error('MCP Search failed:', await searchRes.text());
      return null;
    }

    const searchData = await searchRes.json();
    
    // Assuming the response has a `results` array with objects containing `verse_key`.
    // Example: { results: [{ verse_key: "2:155", score: 0.85 }] }
    const topResult = searchData.results?.[0];
    if (!topResult || !topResult.verse_key) {
      return null;
    }

    const verseKey = topResult.verse_key;
    const [chapterId, verseNum] = verseKey.split(':');

    // 2. Fetch Full Verse Details (similar to getRandomAyah in page.tsx)
    // We need translations, uthmani text, and audio.
    const session = await import('@/lib/session').then(m => m.getServerSession());
    const tId = session.translationResourceId || 131;
    const [chapRes, verseRes] = await Promise.all([
      fetch(`https://api.quran.com/api/v4/chapters/${chapterId}`),
      fetch(`https://api.quran.com/api/v4/verses/by_key/${verseKey}?translations=${tId},20&audio=1&fields=text_uthmani,text_uthmani_simple`)
    ]);

    if (!chapRes.ok || !verseRes.ok) {
       console.error('Failed to fetch verse details for Whisper result');
       return null;
    }

    const chapData = await chapRes.json();
    const verseData = await verseRes.json();
    const verse = verseData.verse;

    return {
      verse_key: verse.verse_key,
      chapter_id: parseInt(chapterId),
      verse_number: parseInt(verseNum),
      text_uthmani: String(verse.text_uthmani || verse.text_uthmani_simple || ''),
      translation: String(verse.translations?.[0]?.text || 'No translation available').replace(/<[^>]*>?/gm, ''),
      tafsir_snippet: 'This Ayah was chosen for you based on the challenge you shared. Reflect on its guidance.',
      audio_url: verse.audio?.url ? (verse.audio.url.startsWith('http') ? verse.audio.url : `https://verses.quran.com/${verse.audio.url}`) : '',
      chapter_name_arabic: String(chapData.chapter.name_arabic || ''),
      chapter_name_english: String(chapData.chapter.name_simple || ''),
    };

  } catch (error) {
    console.error('Error in Life Whisper action:', error);
    return null;
  }
}

import { cookies } from 'next/headers';
import { getTypedSession } from '@/lib/session';
import { getAllNotes } from '@/lib/api';
import { parseNoteBody, isAyahInActionNote } from '@/lib/utils';

export async function getWhisperHistory() {
  const session = await getTypedSession(await cookies());
  const token = session.accessToken;
  if (!token) return [];

  try {
    const res = await getAllNotes(token, undefined, 20);
    const notes = res.data || [];
    
    return notes
      .filter(n => isAyahInActionNote(n))
      .map(n => {
        const { logText, metadata } = parseNoteBody(n.body);
        return {
          id: n.id,
          date: n.createdAt,
          logText,
          metadata
        };
      })
      .filter(n => n.metadata?.type === 'whisper')
      .slice(0, 5);
  } catch (err) {
    console.error('Failed to fetch whisper history:', err);
    return [];
  }
}
