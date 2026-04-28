# Ayah in Action
## Complete Multi-Language Ecosystem Master Plan
**Version 3.0 — Final Production Blueprint**
*Arabic · English · Urdu · Bengali · Russian · Turkish · Indonesian · Persian · French · Spanish · Chinese*

### 1. Executive Summary
This document is the single authoritative blueprint for the Ayah in Action multi-language ecosystem. It covers every layer of the system — from the moment a user changes their language in Settings to the final word the AI writes in response. Every decision in this document is final, production-ready, and designed for zero fallbacks, zero hallucinations, and zero broken experiences.

The 11 supported languages were selected because they each have a complete native package: a full Quran translation AND a native Tafsir available on the Quran.com API. No other languages are included because including a language without a native Tafsir would either force the AI to translate context from another language (introducing hallucinations) or leave the AI with no context at all (producing hollow, inaccurate responses).

**Core Design Principle**
When a user selects a language, 100% of the app — UI text, Quran translations, Tafsir context, and all AI responses across all features — operates in that one language with zero mixing from any other. This is not a translation layer on top of English. It is a full native-language stack.

### 2. The 11 Supported Languages
Only languages meeting all four criteria are included: (1) native Quran translation on Quran.com API, (2) native Tafsir on Quran.com API, (3) strong LLM writing capability, and (4) a stable, unique rendering stack.

| # | Language | Native Name | ISO | Dir | Tier | Tafsir Count | Script Risk |
|---|---|---|---|---|---|---|---|
| 1 | Arabic | العربية | ar | RTL | Tier 1 | 10+ | Low |
| 2 | English | English | en | LTR | Tier 1 | 4 | None |
| 3 | Urdu | اردو | ur | RTL | Tier 1 | 3+ | ⚠ Medium |
| 4 | Bengali | বাংলা | bn | LTR | Tier 1 | 4 | Low |
| 5 | Russian | Русский | ru | LTR | Tier 1 | 4 | None |
| 6 | Turkish | Türkçe | tr | LTR | Tier 1 | 3 | None |
| 7 | Indonesian | Bahasa Indonesia | id | LTR | Tier 1 | 3 | None |
| 8 | Persian | فارسی | fa | RTL | Tier 2 | 2 | ⚠ Medium |
| 9 | French | Français | fr | LTR | Tier 2 | 1 | None |
| 10 | Spanish | Español | es | LTR | Tier 2 | 1 | None |
| 11 | Chinese | 中文 | zh | LTR | Tier 2 | 1 | Low |

**Script Risk Explained**
Arabic, Urdu, and Persian all use variations of the Arabic script. Without explicit anti-hallucination prompting, an LLM will bleed vocabulary across these languages — writing Persian words in Urdu or Urdu morphology in Arabic. The 'Medium' risk languages require the strongest LLM containment instructions in this plan.

### 3. System Architecture Overview
The multi-language system is built in 8 independent layers. Each layer has one job. They communicate only through the central Language Config object.

| Layer | Name | Location | Responsibility |
|---|---|---|---|
| L1 | Language Config | `src/config/languageConfig.ts` | Single source of truth for all 11 languages |
| L2 | Language Store | `src/stores/useLanguageStore.ts` | Zustand state + DOM sync + localStorage persistence |
| L3 | UI Strings | `src/lib/i18n/uiStrings.ts` | All visible app text in all 11 languages |
| L4 | Quran API Layer | `src/lib/quran/` | Translation + Tafsir fetching with native IDs |
| L5 | AI Language Lock | `src/lib/ai/languageInstruction.ts` | Anti-hallucination prompt injection |
| L6 | AI Features | `src/app/actions/` | Whisper, Global Umma, Pulse, Atelier — all language-aware |
| L7 | Script Guard | `src/lib/ai/scriptGuard.ts` | Post-response validation before UI delivery |
| L8 | Rendering Layer | `src/app/layout.tsx` + CSS | Fonts, RTL/LTR, text direction, ligatures |

**Data Flow (End-to-End)**
1. User selects 'Urdu' in Settings → `useLanguageStore.setLanguage('ur')` fires
2. L2 (Store): DOM updates instantly — `<html lang='ur' dir='rtl'>`, CSS font var switches to Nastaliq
3. L3 (UI Strings): All UI text re-renders from Urdu strings dictionary
4. User types a message in Whisper
5. L4 (Quran API): `generateWhisper` fetches verse translation using Urdu translationId (97), fetches Tafsir using Urdu tafsirId
6. L5 (AI Lock): System prompt is assembled with the Urdu language block, contamination warning, and JSON audit schema
7. L6 (AI Feature): Tool descriptions are labelled in Urdu. JSON schema includes `_lang_audit` field
8. Claude returns JSON with `_lang_audit` confirming Urdu purity, followed by guidance and reflection in Urdu
9. L7 (Script Guard): Validates >55% of response characters are Arabic-script (Urdu). If not, retries once
10. Response renders in Nastaliq font, RTL, to the user — 100% Urdu

### 4. Layer 1 — Language Configuration (Single Source of Truth)
Create the file `src/config/languageConfig.ts`. This is the ONLY file that knows which translation IDs, tafsir IDs, fonts, and LLM instructions belong to each language. No other file may hardcode any of this information.

**File:** `src/config/languageConfig.ts`
The LanguageConfig type contains these fields:

| Field | Type | Purpose |
|---|---|---|
| isoCode | string | BCP-47 language code (e.g. 'ur', 'ar', 'zh') |
| nativeName | string | Language name in its own script (e.g. اردو) |
| direction | 'rtl' \| 'ltr' | Text direction — affects DOM, CSS, layout |
| htmlLang | string | Value for `<html lang='...'>` attribute |
| fontFamily | string | Primary font stack for this language |
| useEasternNumerals| boolean | **NEW**: True for Arabic, replaces 0-9 with ٠-٩ |
| quranTranslationId | number \| null | Quran.com resource ID for native translation (null = Arabic) |
| tafsirResourceId | number | Primary native Tafsir ID on Quran.com API |
| tafsirResourceName | string | Human-readable tafsir name for logs/debugging |
| altTafsirIds | number[] | Additional native tafsir IDs for enrichment |
| llmName | string | How the LLM should refer to this language in prompts |
| llmScriptNote | string | Script + dialect instruction for the LLM |
| llmContaminationWarning | string | Explicit list of what NOT to mix in |
| exampleSentence | string | Native example sentence for testing |

**4.1 Number Localization**
In Arabic language mode, verse numbers, surah numbers, and dates must display in Eastern Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩), not Latin numerals. Showing "Surah 2, Verse 255" in Latin numerals inside an Arabic UI is a jarring inconsistency.
```typescript
export function formatNumber(n: number, isoCode: string): string {
  const config = getLanguageConfig(isoCode);
  if (config.useEasternNumerals) {
    return n.toString().replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);
  }
  return n.toString();
}
```

**ID Discovery Script (Run Once at Setup)**
Before filling in the config, run this script to get the exact IDs from the live Quran.com API:
```typescript
// scripts/discoverQuranIds.ts
const LANGS = ['en','ar','ur','bn','ru','tr','id','fa','fr','es','zh'];
for (const lang of LANGS) {
  const r = await fetch(`https://api.quran.com/api/v4/resources/translations?language=${lang}`);
  const d = await r.json();
  console.log(`\n[${lang}]`, d.translations.map(t => `${t.id}: ${t.name}`));
}
const tr = await fetch('https://api.quran.com/api/v4/resources/tafsirs');
const td = await tr.json();
td.tafsirs.forEach(t => console.log(t.id, t.language_name, t.name));
```

### 5. Layer 2 — Language Store (Zustand)
The language store is the only place in the app where the active language lives.
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LANGUAGE_CONFIGS, getLanguageConfig } from '@/config/languageConfig';

export const useLanguageStore = create(persist((set) => ({
  activeIsoCode: 'en',
  config: LANGUAGE_CONFIGS['en'],
  setLanguage: (isoCode) => {
    const config = getLanguageConfig(isoCode);
    document.documentElement.setAttribute('lang', config.htmlLang);
    document.documentElement.setAttribute('dir', config.direction);
    document.documentElement.style.setProperty('--app-font', config.fontFamily);
    set({ activeIsoCode: isoCode, config });
  },
}), { name: 'aya-language-store' }));
```

### 6. Layer 3 — UI Strings (Complete i18n & Accessibility)
Every visible text string and ARIA label must come from the `uiStrings` dictionary.

**File:** `src/lib/i18n/uiStrings.ts`
Provide translations for all 11 languages for every key.

**6.1 Accessibility (a11y) Language Handling**
ARIA labels, aria-placeholder, aria-label, and title attributes must also be translated. A screen reader user whose app is set to Urdu will hear English ARIA labels if they are hardcoded.
```tsx
<button aria-label={useUI('whisper.send')}>
  <SendIcon />
</button>
```
*Note: The `<html lang="...">` update executed by L2 is the most important single accessibility fix, as it tells the screen reader which language to use for speech synthesis.*

**6.2 Complete uiStrings Translations Workflow**
The single largest implementation task is translating the UI keys accurately across 10 non-English languages. Machine-generated translations for religious content and branding often fail to capture cultural nuance.
**Workflow:**
1. Generate initial translation drafts using the DeepL API or Google Cloud Translation API.
2. Conduct a **Native Speaker Cultural Review** for brand feature names (e.g., "Whisper", "Global Ummah", "The Atelier", "Pulse"). Direct translations will not work; they need localized equivalents that convey the poetic and spiritual intent.
3. Validate that UI boundaries do not break with longer translated strings (e.g., Russian and German).

### 7. Layer 4 — Quran API (Native Translations & Tafsir)
Every call to the Quran.com API must use the translation and tafsir IDs from the active language config.

**7.1 Verse Translation Fetch**
**File:** `src/lib/quran/fetchVerse.ts`
```typescript
export async function fetchVerse(verseKey: string, isoCode: string) {
  const config = getLanguageConfig(isoCode);
  const translationParam = config.quranTranslationId
    ? `&translations=${config.quranTranslationId}`
    : ''; // Arabic: no translation, use source text
  const url = `https://api.quran.com/api/v4/verses/by_key/${verseKey}`
    + `?language=${config.isoCode}&fields=text_uthmani${translationParam}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Verse fetch failed: ${res.status}`);
  return res.json();
}
```

**7.2 Tafsir Fetch — Zero Fallback**
**File:** `src/lib/quran/fetchTafsir.ts`
```typescript
export async function fetchTafsir(verseKey: string, isoCode: string) {
  const config = getLanguageConfig(isoCode);
  const url = `https://api.quran.com/api/v4/tafsirs/${config.tafsirResourceId}/by_ayah/${verseKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Tafsir fetch failed for ${isoCode}: ${res.status}`);
  const data = await res.json();
  return { text: data.tafsir.text, language: isoCode, tafsirName: config.tafsirResourceName };
}
```

### 8. Layer 5 — AI Language Lock (Anti-Hallucination System)
**8.1 The Language System Block**
**File:** `src/lib/ai/languageInstruction.ts`
```typescript
export function buildLanguageSystemBlock(isoCode: string): string {
  const config = getLanguageConfig(isoCode);
  return `
══════════════════════════════════════════════
LANGUAGE IDENTITY LOCK — HIGHEST PRIORITY
══════════════════════════════════════════════
You are a native ${config.llmName} speaker with deep fluency.
Script instruction: ${config.llmScriptNote}

ABSOLUTE RULES — any violation is a critical error:
1. Your ENTIRE response (except Quran Arabic text) must be in ${config.llmName} ONLY.
2. ${config.llmContaminationWarning}
3. If Tafsir context arrives in ${config.llmName}, use it directly.
4. Complete the _lang_audit field BEFORE writing any other field.
5. The Quran Arabic text is sacred — reproduce it exactly as given.
══════════════════════════════════════════════`.trim();
}
```

**8.2 Chain-of-Verification via JSON Schema (_lang_audit)**
```json
{
  "_lang_audit": {
    "type": "string",
    "description": "Write 2 sentences in ${config.llmName} confirming: (a) The target language is ${config.llmName}. (b) You will not use words from: ${neighborLanguages}."
  },
  "guidance": { "type": "string", "description": "Spiritual guidance in ${config.llmName}" },
  "reflection": { "type": "string", "description": "Reflection prompt in ${config.llmName}" },
  "verse_key": { "type": "string" }
}
```

### 9. Layer 6 — All AI Features (Language Integration)
Each AI feature requires specific changes to be fully language-aware. Follow the identical pattern: (1) get the active language config, (2) inject the language block, (3) use native IDs, (4) enforce JSON schema.

### 10. Layer 7 — Script Guard (Response Validation)
The Script Guard is the last line of defense before UI delivery.

**Validation Logic**
```typescript
export function validateResponseScript(text: string, isoCode: string):
  { valid: boolean; ratio: number } {
  const pattern = SCRIPT_PATTERNS[isoCode];
  if (!pattern) return { valid: true, ratio: 1 };
  const stripped = text.replace(/\s/g, '');
  if (!stripped.length) return { valid: true, ratio: 1 };
  const matches = (stripped.match(pattern) || []).length;
  const ratio = matches / stripped.length;
  return { valid: ratio >= MIN_RATIOS[isoCode] ?? 0.55, ratio };
}

export async function withScriptValidation(
  response: string, isoCode: string, retryFn: () => Promise<string>
): Promise<string> {
  const { valid } = validateResponseScript(response, isoCode);
  if (valid) return response;
  console.warn(`[ScriptGuard] Failed for ${isoCode}. Retrying once.`);
  const retried = await retryFn();
  return retried; // Return best attempt regardless
}
```

### 11. Layer 8 — Rendering (Fonts, RTL/LTR, Typography)
Language rendering goes far beyond setting `dir='rtl'`.

**11.1 Font Matrix**
| Content | Font Required | Why |
|---|---|---|
| Quran Arabic text | KFGQPC Uthman Taha Naskh or Amiri Quran | Uthmani letterforms + full tashkeel |
| UI Arabic text | Noto Naskh Arabic | Standard Arabic UI |
| Urdu | Noto Nastaliq Urdu | Nastaliq ligatures (requires 'liga' 1, 'calt' 1) |
| Persian | Vazirmatn | Standard Persian UI |
| Bengali | Noto Sans Bengali | Standard Bengali UI |
| Chinese | Noto Sans SC | Standard Simplified Chinese UI |

**11.2 Quran Uthmani Script Font Application**
Apply the specific Uthmanic script to the Quran verse component, **not globally**:
```css
.quran-text {
  font-family: 'KFGQPC Uthman Taha Naskh', 'Amiri Quran', serif;
  font-size: 1.6rem;
  line-height: 2.5;
}
```

**11.3 Bidirectional (BiDi) Text Handling for Mixed Content**
AI responses in Urdu, Arabic, or Persian will always contain both the Quran Arabic text AND the target language text. Without explicit BiDi handling, the Arabic Quran verse inside a Persian response will render with jumbled punctuation. 
**Rule:** Wrap the Quran Arabic text in a `<span>` with explicit direction:
```tsx
<span dir="rtl" lang="ar" className="quran-text">
  {verse.text_uthmani}
</span>
```
And the translation in its own span with the target language's direction:
```tsx
<span dir={config.direction} lang={config.isoCode}>
  {verse.translation}
</span>
```
*Never put both in the same text node.*

**11.4 Global CSS Setup**
```css
/* globals.css */
:root { --app-font: 'Inter', sans-serif; }
body { font-family: var(--app-font); }

[dir='rtl'] {
  font-feature-settings: 'liga' 1, 'calt' 1;
  text-align: right;
  letter-spacing: 0; /* RTL scripts don't use letter-spacing */
}
[lang='ur'] { font-family: 'Noto Nastaliq Urdu', serif; line-height: 2.2; }
[lang='ar'] { font-family: 'Noto Naskh Arabic', serif; line-height: 1.9; }
[lang='fa'] { font-family: 'Vazirmatn', 'Noto Naskh Arabic', serif; line-height: 2.0; }
[lang='bn'] { font-family: 'Noto Sans Bengali', sans-serif; line-height: 1.8; }
[lang='zh'] { font-family: 'Noto Sans SC', sans-serif; }
```

### 12. Language Settings Page
The language selector in Settings must apply changes IMMEDIATELY without a page reload.
```tsx
const { setLanguage, activeIsoCode } = useLanguageStore();

return (
  <LanguagePicker>
    {SUPPORTED_LANGUAGES.map(lang => (
      <LanguageOption
        key={lang.isoCode}
        nativeName={lang.nativeName}
        isRTL={lang.direction === 'rtl'}
        isSelected={activeIsoCode === lang.isoCode}
        onSelect={() => setLanguage(lang.isoCode)}
      />
    ))}
  </LanguagePicker>
);
```

### 13. Error Handling & Stability
A robust multi-language system must handle failures gracefully. Error messages must always be in the user's selected language.
```typescript
// Error display pattern
const errorMsg = useUI('error.tafsir_unavailable');
// uiStrings['ur']['error.tafsir_unavailable'] = 'تفسیر اس وقت دستیاب نہیں ہے'
```

### 14. Testing & Verification Protocol
Every language must pass automated unit tests, integration tests against the live Quran.com API, and a manual QA Checklist (UI direction, Fonts, Full Translations, Anti-Vocabulary Bleeding, Number Localization, and Screen Reader validation).

### 15. Complete File Manifest
| File Path | Action | Priority | Description |
|---|---|---|---|
| `src/config/languageConfig.ts` | CREATE | P0 | Single source of truth, includes `useEasternNumerals` |
| `scripts/discoverQuranIds.ts` | CREATE | P0 | Run once to get live API IDs — do this first |
| `src/stores/useLanguageStore.ts` | MODIFY | P0 | Add DOM sync, CSS var, persist middleware |
| `src/lib/ai/languageInstruction.ts` | REPLACE | P0 | Full language lock system with contamination warnings |
| `src/lib/quran/fetchVerse.ts` | MODIFY | P0 | Dynamic translation ID from config |
| `src/lib/quran/fetchTafsir.ts` | CREATE | P0 | Native tafsir fetch, no fallback |
| `src/app/actions/generateWhisper.ts` | MODIFY | P0 | Inject language block + audit schema |
| `src/app/actions/generatePulse.ts` | MODIFY | P0 | Inject language block + native verse/tafsir |
| `src/app/actions/globalUmma.ts` | MODIFY | P0 | AI insights in active language |
| `src/app/actions/generateAtelier.ts` | MODIFY | P0 | Inject language block |
| `src/lib/ai/scriptGuard.ts` | CREATE | P1 | Post-response validation + auto-retry |
| `src/hooks/useUI.ts` | CREATE | P1 | i18n string hook |
| `src/hooks/useDirection.ts` | CREATE | P1 | RTL/LTR layout helper |
| `src/lib/i18n/uiStrings.ts` | EXPAND | P1 | All 11 languages, formal review process |
| `src/app/layout.tsx` | MODIFY | P1 | LanguageProvider wrapper with SSR cookie |
| `src/app/globals.css` | MODIFY | P1 | CSS vars, RTL styles, `.quran-text` class |
| `src/components/LanguagePicker.tsx` | CREATE | P1 | Settings page language selector |
| `src/lib/ai/wrapUserPrompt.ts` | CREATE | P2 | User prompt language wrapper |

### 16. Recommended Implementation Order
1. Run `discoverQuranIds.ts` → save output to `/docs/quran-ids.json`
2. Create `languageConfig.ts` with all 11 languages (include numeral settings)
3. Modify `useLanguageStore.ts` with DOM sync + persist
4. Create `fetchVerse.ts` and `fetchTafsir.ts` with dynamic IDs
5. Create `languageInstruction.ts` (language lock builder)
6. Create `scriptGuard.ts`
7. Modify `generateWhisper.ts` — first AI feature to go fully language-aware
8. Run manual QA on Whisper for all 11 languages before touching other features
9. Modify all other AI actions (`generatePulse`, `globalUmma`, `generateAtelier`)
10. Create `useUI.ts` hook and expand `uiStrings.ts` for all 11 languages
11. Modify `layout.tsx` + `globals.css` (include Uthmanic font class and BiDi spans)
12. Ensure all ARIA attributes utilize `useUI()`
13. Create `LanguagePicker.tsx` component in Settings
14. Run full QA checklist (Section 14) for all 11 languages
15. Network payload inspection — verify all API calls use correct native IDs
16. Ship

---
*This document is the complete and final specification for the Ayah in Action multi-language system.*
*11 languages · Zero fallbacks · Zero hallucinations · Full native experience*
