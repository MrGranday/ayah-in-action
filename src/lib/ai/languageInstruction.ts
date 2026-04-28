import { getLanguageConfig } from '@/config/languageConfig';

/**
 * buildLanguageSystemBlock
 * The Layer 5 "Language Identity Lock" as specified in the Master Plan.
 */
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

/**
 * buildLangAuditDescription
 * Generates the dynamic description for the JSON _lang_audit field.
 */
export function buildLangAuditDescription(isoCode: string): string {
  const config = getLanguageConfig(isoCode);
  const neighbors = config.neighborLanguages.join(', ');
  return `Write 2 sentences in ${config.llmName} confirming: (a) The target language is ${config.llmName}. (b) You will not use words from: ${neighbors}.`.trim();
}
