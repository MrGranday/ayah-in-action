import { NextRequest, NextResponse } from 'next/server';
import { getQuranClient, getRandomChapter, getRandomVerse } from '@/lib/quran-sdk';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const client = getQuranClient();
    
    const chapterId = getRandomChapter();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chapter = await client.chapters.findById(chapterId as any);
    const versesCount = chapter.versesCount;
    const verseNum = getRandomVerse(chapterId, versesCount);
    
    // Fetch verse with English translation (Resource ID 131 is generally Clear Quran or similar popular one)
    // and audio
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const verse = await client.verses.findByKey(`${chapterId}:${verseNum}` as any, {
      translations: [131],
      audio: 1
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    
    const translationText = verse.translations?.[0]?.text || 'No translation available';
    
    const audioUrl = verse.audio?.url || '';
    
    const processedVerse = {
      verse_key: verse.verseKey,
      chapter_id: chapterId,
      verse_number: verseNum,
      text_uthmani: verse.textUthmani || verse.textUthmaniSimple || '',
      translation: translationText,
      tafsir_snippet: 'Reflect on this verse and consider how it applies to your daily life.',
      audio_url: audioUrl,
      chapter_name_arabic: chapter.nameArabic,
      chapter_name_english: chapter.nameSimple,
    };

    return NextResponse.json(processedVerse);
  } catch (error) {
    console.error('Error fetching random ayah:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ayah' },
      { status: 500 }
    );
  }
}
