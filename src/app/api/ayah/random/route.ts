import { NextRequest, NextResponse } from 'next/server';
import { getQuranClient, getRandomChapter, getRandomVerse } from '@/lib/quran-sdk';

export const dynamic = 'force-dynamic';

const FALLBACK_AYAH = {
  verse_key: '2:255',
  chapter_id: 2,
  verse_number: 255,
  text_uthmani: 'ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَيُّ ٱلْقَيُّومُ ۚ لَا تَأْخُذُهُۥ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُۥ مَا فِي ٱلسَّمَٰوَٰتِ وَمَا فِي ٱلْأَرْضِ ۚ مَن ذَا ٱلَّذِي يَشْفَعُ عِندَهُۥ إِلَّا بِإِذْنِهِۥ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۚ وَلَا يُحِيطُونَ بِشَىْءٍ مِّنْ عِلْمِهِۥ إِلَّا بِمَا شَآءَ ۚ وَسِعَ كُرْسِيُّهُ ٱلسَّمَٰوَٰتِ وَٱلْأَرْضَ ۚ وَلَا يَئُودُهُۥ حِفْظُهُمَا ۚ وَهُوَ ٱلْعَلِيُّ ٱلْعَظِيمُ',
  translation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is present before them and what is after them, and they encompass not a thing of His knowledge except for what He wills. His Throne extends over the heavens and the earth, and their preservation does not burden Him; and He is the Most High, the Most Great.',
  tafsir_snippet: 'This is Ayah al-Kursi, one of the greatest verses in the Quran. Reflect on Allah\'s names and attributes.',
  audio_url: '',
  chapter_name_arabic: 'البقرة',
  chapter_name_english: 'Al-Baqarah',
};

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
    return NextResponse.json(FALLBACK_AYAH);
  }
}
