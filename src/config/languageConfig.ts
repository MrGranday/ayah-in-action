export type LanguageConfig = {
  isoCode: string;
  nativeName: string;
  direction: 'rtl' | 'ltr';
  htmlLang: string;
  speechLang: string;
  fontFamily: string;
  useEasternNumerals: boolean;
  quranTranslationId: number | null;
  tafsirResourceId: number;
  tafsirResourceName: string;
  altTafsirIds: number[];
  llmName: string;
  llmScriptNote: string;
  llmContaminationWarning: string;
  neighborLanguages: string[];
  exampleSentence: string;
  qfPreferenceSupported?: boolean;
};

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  en: {
    isoCode: 'en',
    nativeName: 'English',
    direction: 'ltr',
    htmlLang: 'en',
    speechLang: 'en-US',
    fontFamily: '"Inter", sans-serif',
    useEasternNumerals: false,
    quranTranslationId: 85, // M.A.S. Abdel Haleem
    tafsirResourceId: 169, // Tafsir Ibn Kathir (Abridged)
    tafsirResourceName: 'Tafsir Ibn Kathir (English)',
    altTafsirIds: [168, 817],
    llmName: 'English',
    llmScriptNote: 'Standard Latin script.',
    llmContaminationWarning: 'Do NOT use archaic forms (thee, thou) unless quoting classical text.',
    neighborLanguages: ['Old English', 'Middle English', 'Latin-heavy academic jargon'],
    exampleSentence: 'I am seeking peace and guidance today.',
  },
  ar: {
    isoCode: 'ar',
    nativeName: 'العربية',
    direction: 'rtl',
    htmlLang: 'ar',
    speechLang: 'ar-SA',
    fontFamily: '"Noto Naskh Arabic", serif',
    useEasternNumerals: true,
    quranTranslationId: null, // Arabic uses source text
    tafsirResourceId: 14, // Tafsir Ibn Kathir
    tafsirResourceName: 'Tafsir Ibn Kathir (Arabic)',
    altTafsirIds: [16, 93, 15, 90, 91, 94],
    llmName: 'Arabic',
    llmScriptNote: 'Standard Arabic script.',
    llmContaminationWarning: 'Do NOT use dialectal Arabic. Use Fusha (Modern Standard Arabic) only.',
    neighborLanguages: ['Urdu', 'Persian', 'Egyptian Arabic', 'Maghrebi Arabic'],
    exampleSentence: 'أشعر بالقلق اليوم وأبحث عن الطمأنينة.',
  },
  ur: {
    isoCode: 'ur',
    nativeName: 'اردو',
    direction: 'rtl',
    htmlLang: 'ur',
    speechLang: 'ur-PK',
    fontFamily: '"Noto Nastaliq Urdu", serif',
    useEasternNumerals: false,
    quranTranslationId: 97, // Tafheem e Qur'an
    tafsirResourceId: 160, // Tafsir Ibn Kathir (Urdu)
    tafsirResourceName: 'Tafsir Ibn Kathir (Urdu)',
    altTafsirIds: [157, 159, 818],
    llmName: 'Urdu',
    llmScriptNote: 'Urdu Nastaliq script.',
    llmContaminationWarning: 'Do NOT use Persian words, Hindi words, or Roman Urdu. Every word must be Urdu Nastaliq.',
    neighborLanguages: ['Persian', 'Arabic', 'Hindi'],
    exampleSentence: 'میں آج بہت پریشان ہوں اور سکون کی تلاش میں ہوں۔',
  },
  bn: {
    isoCode: 'bn',
    nativeName: 'বাংলা',
    direction: 'ltr',
    htmlLang: 'bn',
    speechLang: 'bn-BD',
    fontFamily: '"Noto Sans Bengali", sans-serif',
    useEasternNumerals: false,
    quranTranslationId: 163, // Sheikh Mujibur Rahman
    tafsirResourceId: 164, // Tafseer ibn Kathir
    tafsirResourceName: 'Tafsir Ibn Kathir (Bengali)',
    altTafsirIds: [381, 165, 166],
    llmName: 'Bengali',
    llmScriptNote: 'Standard Bengali script.',
    llmContaminationWarning: 'Do NOT transliterate from Arabic or English. Use native Bengali Islamic vocabulary.',
    neighborLanguages: ['Hindi', 'Assamese', 'English'],
    exampleSentence: 'আমি আজ খুব চিন্তিত এবং শান্তি খুঁজছি।',
  },
  ru: {
    isoCode: 'ru',
    nativeName: 'Русский',
    direction: 'ltr',
    htmlLang: 'ru',
    speechLang: 'ru-RU',
    fontFamily: '"Noto Sans", sans-serif',
    useEasternNumerals: false,
    quranTranslationId: 45, // Elmir Kuliev
    tafsirResourceId: 170, // Al-Sa'di
    tafsirResourceName: 'Tafseer Al-Saddi (Russian)',
    altTafsirIds: [],
    llmName: 'Russian',
    llmScriptNote: 'Cyrillic script.',
    llmContaminationWarning: 'Do NOT mix Ukrainian or Belarusian. Use standard Modern Russian.',
    neighborLanguages: ['Ukrainian', 'Belarusian', 'Bulgarian'],
    exampleSentence: 'Сегодня я чувствую тревогу и ищу покоя.',
  },
  tr: {
    isoCode: 'tr',
    nativeName: 'Türkçe',
    direction: 'ltr',
    htmlLang: 'tr',
    speechLang: 'tr-TR',
    fontFamily: "'Inter', sans-serif",
    useEasternNumerals: false,
    quranTranslationId: 77, // Diyanet Isleri
    tafsirResourceId: 306, // Al-Mukhtasar
    tafsirResourceName: 'Al-Mukhtasar',
    altTafsirIds: [],
    llmName: 'Turkish',
    llmScriptNote: 'Write in modern Turkish using Latin script.',
    llmContaminationWarning: 'DO NOT use English words or phrases.',
    neighborLanguages: ['Azerbaijani', 'Ottoman Turkish', 'English'],
    exampleSentence: 'Bugün endişeliyim ve huzur arıyorum.',
  },
  id: {
    isoCode: 'id',
    nativeName: 'Bahasa Indonesia',
    direction: 'ltr',
    htmlLang: 'id',
    speechLang: 'id-ID',
    fontFamily: "'Inter', sans-serif",
    useEasternNumerals: false,
    quranTranslationId: 33, // Indonesian Islamic Affairs Ministry
    tafsirResourceId: 260, // Al-Mukhtasar
    tafsirResourceName: 'Al-Mukhtasar',
    altTafsirIds: [],
    llmName: 'Indonesian',
    llmScriptNote: 'Write in standard Indonesian (EYD) using Latin script.',
    llmContaminationWarning: 'DO NOT use English words or phrases.',
    neighborLanguages: ['Malay', 'English', 'Dutch'],
    exampleSentence: 'Saya merasa cemas hari ini and mencari kedamaian.',
  },
  fa: {
    isoCode: 'fa',
    nativeName: 'فارسی',
    direction: 'rtl',
    htmlLang: 'fa',
    speechLang: 'fa-IR',
    fontFamily: "'Vazirmatn', sans-serif",
    useEasternNumerals: false,
    quranTranslationId: 135, // IslamHouse.com
    tafsirResourceId: 263, // Al-Mukhtasar
    tafsirResourceName: 'Al-Mukhtasar',
    altTafsirIds: [],
    llmName: 'Persian',
    llmScriptNote: 'Write in modern Persian using Arabic/Persian script.',
    llmContaminationWarning: 'DO NOT use English or Arabic words except Quranic terms.',
    neighborLanguages: ['Arabic', 'Urdu', 'Dari', 'Tajik'],
    exampleSentence: 'امروز حالم خوب نیست و به دنبال آرامش هستم.',
  },
  fr: {
    isoCode: 'fr',
    nativeName: 'Français',
    direction: 'ltr',
    htmlLang: 'fr',
    speechLang: 'fr-FR',
    fontFamily: "'Inter', sans-serif",
    useEasternNumerals: false,
    quranTranslationId: 136, // Montada Islamic Foundation
    tafsirResourceId: 259, // Al-Mukhtasar
    tafsirResourceName: 'Al-Mukhtasar',
    altTafsirIds: [],
    llmName: 'French',
    llmScriptNote: 'Write in standard French with proper accents.',
    llmContaminationWarning: 'DO NOT use English words or phrases.',
    neighborLanguages: ['English', 'Spanish', 'Italian'],
    exampleSentence: 'Je me sens anxieux aujourd hui et je cherche la paix.',
  },
  es: {
    isoCode: 'es',
    nativeName: 'Español',
    direction: 'ltr',
    htmlLang: 'es',
    speechLang: 'es-ES',
    fontFamily: "'Inter', sans-serif",
    useEasternNumerals: false,
    quranTranslationId: 83, // Sheikh Isa Garcia
    tafsirResourceId: 268, // Al-Mukhtasar
    tafsirResourceName: 'Al-Mukhtasar',
    altTafsirIds: [],
    llmName: 'Spanish',
    llmScriptNote: 'Write in standard Spanish (Castilian/Neutral).',
    llmContaminationWarning: 'DO NOT use English words or phrases.',
    neighborLanguages: ['Portuguese', 'Italian', 'English'],
    exampleSentence: 'Me siento ansioso hoy y busco paz.',
  },
  zh: {
    isoCode: 'zh',
    nativeName: '中文',
    direction: 'ltr',
    htmlLang: 'zh',
    speechLang: 'zh-CN',
    fontFamily: "'Noto Sans SC', sans-serif",
    useEasternNumerals: false,
    quranTranslationId: 109, // Muhammad Makin
    tafsirResourceId: 264, // Al-Mukhtasar
    tafsirResourceName: 'Al-Mukhtasar',
    altTafsirIds: [],
    llmName: 'Chinese (Simplified)',
    llmScriptNote: 'Write in Simplified Chinese characters.',
    llmContaminationWarning: 'DO NOT use English or Pinyin.',
    neighborLanguages: ['Traditional Chinese', 'Japanese', 'Korean', 'English'],
    exampleSentence: '我今天感到焦虑，正在寻找内心的平静。',
  }
};

export function getLanguageConfig(isoCode: string): LanguageConfig {
  return LANGUAGE_CONFIGS[isoCode] || LANGUAGE_CONFIGS['en'];
}

export function formatNumber(n: number, isoCode: string): string {
  const config = getLanguageConfig(isoCode);
  if (config.useEasternNumerals) {
    return n.toString().replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]);
  }
  return n.toString();
}
