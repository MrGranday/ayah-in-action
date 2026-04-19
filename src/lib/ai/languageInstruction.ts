// lib/ai/languageInstruction.ts

const LANGUAGE_GUARDRAILS: Partial<Record<string, string>> = {
  ps: `
CRITICAL DISAMBIGUATION: You are writing in PASHTO (پښتنو), NOT Persian, NOT Dari, NOT Urdu.
Pashto-specific markers you MUST use:
- First person singular: "زه" (I), NOT "من"
- Second person: "ته" (you), NOT "تو" or "شما"  
- Verb "to be": "یم / دی / دي" NOT "هستم / است"
- Conjunction "that/which": "چې" NOT "که" or "که که"
- Question words: "څه" (what), "چیرې" (where), "کله" (when)
If you write "هستم", "است", "میکنم", "میکنم" — those are Persian. STOP and rewrite.
Do NOT write Persian under any circumstances.`,

  sd: `
CRITICAL: You are writing SINDHI (سنڌي), NOT Urdu, NOT Punjabi.
Sindhi uses ڄ ڃ ڀ ٻ ڦ ڏ ڊ ڌ ڍ — letters that do not exist in Urdu.
Do NOT write in standard Urdu script.`,

  ku: `
CRITICAL: You are writing KURDISH SORANI (کوردی), NOT Persian, NOT Arabic.
Kurdish uses letters like: ڕ ڵ ێ ۆ ێ — not found in Persian.
Do NOT write Persian. Do NOT write Arabic prose.`,

  ur: `
You are writing URDU (اردو). 
Urdu is NOT Hindi written in Arabic script. Urdu uses proper Nastaliq vocabulary.
Do NOT transliterate Hindi words into Arabic script.`,
};

export function getLanguageInstruction(isoCode: string, direction: string): string {
  const LANGUAGE_NAMES: Record<string, { english: string; native: string }> = {
    en: { english: 'English',         native: 'English'    },
    ar: { english: 'Arabic',          native: 'العربية'    },
    ur: { english: 'Urdu',            native: 'اردو'       },
    bn: { english: 'Bengali',         native: 'বাংলা'      },
    fa: { english: 'Persian',         native: 'فارسی'      },
    ps: { english: 'Pashto',          native: 'پښتو'       },
    id: { english: 'Indonesian',      native: 'Indonesia'  },
    ms: { english: 'Malay',           native: 'Melayu'     },
    tr: { english: 'Turkish',         native: 'Türkçe'     },
    fr: { english: 'French',          native: 'Français'   },
    ru: { english: 'Russian',         native: 'Русский'    },
    zh: { english: 'Chinese',         native: '中文'        },
    sw: { english: 'Swahili',         native: 'Kiswahili'  },
    es: { english: 'Spanish',         native: 'Español'    },
    de: { english: 'German',          native: 'Deutsch'    },
    hi: { english: 'Hindi',           native: 'हिन्दी'     },
    sd: { english: 'Sindhi',          native: 'سنڌي'       },
    ta: { english: 'Tamil',           native: 'தமிழ்'      },
    ml: { english: 'Malayalam',       native: 'മലയാളം'     },
    ku: { english: 'Kurdish',         native: 'کوردی'      },
    az: { english: 'Azerbaijani',     native: 'Azərbaycan' },
    ha: { english: 'Hausa',           native: 'Hausa'      },
    so: { english: 'Somali',          native: 'Soomaali'   },
    uz: { english: 'Uzbek',           native: 'Oʻzbek'     },
  };

  const lang = LANGUAGE_NAMES[isoCode] ?? { english: isoCode, native: isoCode };
  const guardrail = LANGUAGE_GUARDRAILS[isoCode] ?? '';

  return `
===== MANDATORY LANGUAGE REQUIREMENT =====
You MUST respond ENTIRELY in ${lang.english} (${lang.native}).
ISO code: ${isoCode}
Text direction: ${direction === 'rtl' ? 'RIGHT-TO-LEFT' : 'LEFT-TO-RIGHT'}

${guardrail}

RULES — NO EXCEPTIONS:
1. Every single word must be in ${lang.english}.
2. Do NOT use English in your response (except to quote proper nouns with no translation).
3. Do NOT use Arabic prose (quoting Quran Arabic text is allowed, translation must be ${lang.english}).
4. Do NOT switch to a related language because it is easier.
5. If unsure of a word, use a simpler ${lang.english} word. Never substitute another language.
6. Your ENTIRE response — every sentence, every label, every explanation — must be ${lang.english}.

VIOLATION CHECK: Before responding, confirm: "Is every word I am about to write in ${lang.english}?"
==========================================
`.trim();
}
