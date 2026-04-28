import { getLanguageConfig } from '@/config/languageConfig';

export async function fetchVerse(verseKey: string, isoCode: string) {
  const config = getLanguageConfig(isoCode);
  const translationParam = config.quranTranslationId
    ? `&translations=${config.quranTranslationId}`
    : ''; // Arabic: no translation, use source text
  const url = `https://api.quran.com/api/v4/verses/by_key/${verseKey}`
    + `?language=${config.isoCode}&fields=text_uthmani,text_uthmani_simple&audio=1${translationParam}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Verse fetch failed: ${res.status}`);
  return res.json();
}
