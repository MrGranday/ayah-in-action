import { NextRequest, NextResponse } from 'next/server';
import { getQuranClient, getRandomChapter, getRandomVerse } from '@/lib/quran-sdk';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const client = getQuranClient();
    
    const chapterId = getRandomChapter();
    const chapter = await client.chapters.chapter(chapterId);
    const versesCount = chapter.data.verses_count;
    const verseNum = getRandomVerse(chapterId, versesCount);
    
    const verse = await client.quran.getVerse(chapterId, verseNum);
    const verseData = verse.data;
    
    const translations = await client.quran.getTranslations(verseData.translations.map(t => t.id), chapterId, verseNum);
    const translationText = translations.data[0]?.text || 'No translation available';
    
    let audioUrl = '';
    if (verseData.audio_files && verseData.audio_files.length > 0) {
      audioUrl = verseData.audio_files[0].url;
    }
    
    const processedVerse = {
      verse_key: verseData.verse_key,
      chapter_id: verseData.chapter_id,
      verse_number: verseData.verse_number,
      text_uthmani: verseData.text_uthmani,
      translation: translationText,
      tafsir_snippet: 'Reflect on this verse and consider how it applies to your daily life.',
      audio_url: audioUrl,
      chapter_name_arabic: chapter.data.name_arabic,
      chapter_name_english: chapter.data.name_simple,
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
