import { getLanguageConfig } from '@/config/languageConfig';

/**
 * buildLanguageSystemBlock
 * Layer 5 — "Language Identity Lock".
 *
 * BUG FIX: Previous version had weak instructions that LLMs ignored.
 * New version adds:
 *  1. A NATIVE EXAMPLE sentence from languageConfig (primes the model's context)
 *  2. A mandatory SELF-CHECK step before any output
 *  3. Explicit "CONTAMINATION = CRITICAL FAILURE" signal
 *  4. A banned-pattern note to reinforce the neighborLanguages warning
 */
export function buildLanguageSystemBlock(isoCode: string): string {
  const config = getLanguageConfig(isoCode);
  return `
══════════════════════════════════════════════════════════
LANGUAGE IDENTITY LOCK — SUPREME PRIORITY — READ FIRST
══════════════════════════════════════════════════════════
TARGET LANGUAGE : ${config.llmName}
SCRIPT          : ${config.llmScriptNote}
EXAMPLE SENTENCE: "${config.exampleSentence}"

You are a native ${config.llmName} speaker with full mastery of this language.
Before generating ANY content, complete this mandatory self-check:
  STEP 1: Confirm to yourself — "I am responding in ${config.llmName}."
  STEP 2: Set the _lang_audit field FIRST in your JSON output.
  STEP 3: Write every word of your response in ${config.llmName} script as shown in the example above.

ABSOLUTE PROHIBITIONS — each violation is a CRITICAL FAILURE:
1. NEVER output words from these languages: ${config.neighborLanguages.join(', ')}.
2. ${config.llmContaminationWarning}
3. The ONLY exception is: Quran Arabic text must be reproduced exactly as given (sacred).
4. If you detect yourself slipping into another language mid-sentence — STOP, DELETE that sentence, restart it in ${config.llmName}.
5. Do NOT use English as a fallback for any word. If you don't know the ${config.llmName} term, use the closest native Islamic equivalent.

CONTAMINATION SELF-TEST: Before finalizing your response, scan it. If ANY word does not belong to ${config.llmName}, replace it. If you cannot replace it, omit it.
══════════════════════════════════════════════════════════`.trim();
}

/**
 * buildLangAuditDescription
 * Generates the dynamic _lang_audit field description for JSON schema.
 * Forces the model to prove language compliance before writing other fields.
 */
export function buildLangAuditDescription(isoCode: string): string {
  const config = getLanguageConfig(isoCode);
  const neighbors = config.neighborLanguages.join(', ');
  return `[MANDATORY — write this field FIRST] Write exactly 2 sentences in ${config.llmName}: (a) Confirm: "My entire response is in ${config.llmName}." (b) Confirm: "I have not used any words from: ${neighbors}."`.trim();
}

/**
 * buildSynthesisPrompt
 * Generates a language-locked synthesis instruction for the Groq/HF two-stage pipeline.
 *
 * BUG FIX: Previously SYNTHESIS_PROMPT was a hardcoded English string, which caused
 * Groq and HuggingFace models to revert to English for their final output.
 * Now it injects the full language block to maintain the lock through synthesis.
 */
export function buildSynthesisPrompt(isoCode: string): string {
  const config = getLanguageConfig(isoCode);
  return `${buildLanguageSystemBlock(isoCode)}

You have gathered all necessary Quranic data in the conversation above.
Now synthesize it into the final spiritual guidance output.

CRITICAL: Your response MUST be 100% in ${config.llmName}. Zero English words.
Output ONLY valid JSON — no markdown, no prose before or after:
{ "_lang_audit": "...", "verse_key": "...", "guidance": "...", "reflection": "..." }`.trim();
}
