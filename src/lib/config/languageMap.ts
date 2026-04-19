export const LANGUAGE_CONFIG: Record<string, {
  resourceId: number
  direction: 'ltr' | 'rtl'
  nativeName: string
  qfPreferenceSupported: boolean
}> = {
  en: { resourceId: 131, direction: 'ltr', nativeName: 'English',    qfPreferenceSupported: true  },
  ur: { resourceId: 97,  direction: 'rtl', nativeName: 'اردو',       qfPreferenceSupported: true  },
  bn: { resourceId: 161, direction: 'ltr', nativeName: 'বাংলা',      qfPreferenceSupported: true  },
  fa: { resourceId: 135, direction: 'rtl', nativeName: 'فارسی',      qfPreferenceSupported: true  },
  id: { resourceId: 33,  direction: 'ltr', nativeName: 'Indonesia',  qfPreferenceSupported: true  },
  ms: { resourceId: 39,  direction: 'ltr', nativeName: 'Melayu',     qfPreferenceSupported: true  },
  tr: { resourceId: 77,  direction: 'ltr', nativeName: 'Türkçe',     qfPreferenceSupported: true  },
  fr: { resourceId: 136, direction: 'ltr', nativeName: 'Français',   qfPreferenceSupported: true  },
  ru: { resourceId: 79,  direction: 'ltr', nativeName: 'Русский',    qfPreferenceSupported: true  },
  zh: { resourceId: 76,  direction: 'ltr', nativeName: '中文',        qfPreferenceSupported: true  },
  sw: { resourceId: 207, direction: 'ltr', nativeName: 'Kiswahili',  qfPreferenceSupported: true  },
  es: { resourceId: 83,  direction: 'ltr', nativeName: 'Español',    qfPreferenceSupported: true  },
  sq: { resourceId: 71,  direction: 'ltr', nativeName: 'Shqip',      qfPreferenceSupported: true  },
  nl: { resourceId: 144, direction: 'ltr', nativeName: 'Nederlands', qfPreferenceSupported: true  },
  it: { resourceId: 150, direction: 'ltr', nativeName: 'Italiano',   qfPreferenceSupported: true  },
  pt: { resourceId: 103, direction: 'ltr', nativeName: 'Português',  qfPreferenceSupported: true  },
  th: { resourceId: 104, direction: 'ltr', nativeName: 'ภาษาไทย',    qfPreferenceSupported: true  },
  vi: { resourceId: 242, direction: 'ltr', nativeName: 'Tiếng Việt', qfPreferenceSupported: true  },
  
  // Tier 2 - Not natively supported by QF Preferences Enum (uses local cookie sync instead)
  hi: { resourceId: 82,  direction: 'ltr', nativeName: 'हिन्दी',     qfPreferenceSupported: false },
  sd: { resourceId: 132, direction: 'rtl', nativeName: 'سنڌي',       qfPreferenceSupported: false },
  ps: { resourceId: 84,  direction: 'rtl', nativeName: 'پښتو',       qfPreferenceSupported: false },
  de: { resourceId: 27,  direction: 'ltr', nativeName: 'Deutsch',    qfPreferenceSupported: false },
  ta: { resourceId: 38,  direction: 'ltr', nativeName: 'தமிழ்',      qfPreferenceSupported: false },
  ml: { resourceId: 164, direction: 'ltr', nativeName: 'മലയാളം',     qfPreferenceSupported: false },
  uz: { resourceId: 74,  direction: 'ltr', nativeName: 'Uzbek',      qfPreferenceSupported: false },
  so: { resourceId: 237, direction: 'ltr', nativeName: 'Soomaali',   qfPreferenceSupported: false },
  ha: { resourceId: 236, direction: 'ltr', nativeName: 'Hausa',      qfPreferenceSupported: false },
  ku: { resourceId: 381, direction: 'rtl', nativeName: 'کوردی',      qfPreferenceSupported: false },
  az: { resourceId: 75,  direction: 'ltr', nativeName: 'Azərbaycan', qfPreferenceSupported: false },
};
