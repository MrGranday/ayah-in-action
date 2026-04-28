import { getLanguageConfig } from '@/config/languageConfig';

export async function fetchTafsir(verseKey: string, isoCode: string) {
  const config = getLanguageConfig(isoCode);
  const url = `https://api.quran.com/api/v4/tafsirs/${config.tafsirResourceId}/by_ayah/${verseKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Tafsir fetch failed for ${isoCode}: ${res.status}`);
  const data = await res.json();
  return { text: data.tafsir.text, language: isoCode, tafsirName: config.tafsirResourceName };
}
