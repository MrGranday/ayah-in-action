export interface ProcessedVerse {
  verse_key: string;
  chapter_id: number;
  verse_number: number;
  text_uthmani: string;
  translation: string;
  tafsir_snippet: string;
  audio_url: string;
  chapter_name_arabic: string;
  chapter_name_english: string;
}

export interface Chapter {
  id: number;
  name_arabic: string;
  name_english: string;
  verses_count: number;
}

export interface Verse {
  verse_key: string;
  chapter_id: number;
  verse_number: number;
  text_uthmani: string;
}

export interface Translation {
  resource_id: number;
  text: string;
}

export interface Tafsir {
  text: string;
}
