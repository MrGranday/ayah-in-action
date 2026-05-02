import { getLanguageConfig } from '@/config/languageConfig';

/**
 * wrapUserPrompt
 * Layer 5 supplement — wraps user input with language-specific priming.
 *
 * BUG FIX: Previous version had an English-language template wrapping native text.
 * LLMs pattern-match to the template language and bleed English into responses.
 * Fix: inject the native example sentence FIRST so the model sees native script
 * before reading the English instruction header.
 */
export function wrapUserPrompt(challenge: string, isoCode: string): string {
  const config = getLanguageConfig(isoCode);
  return `LANGUAGE: ${config.llmName} | SCRIPT: ${config.llmScriptNote}
NATIVE EXAMPLE: "${config.exampleSentence}"

USER INPUT:
"${challenge}"

RESPOND ENTIRELY IN ${config.llmName.toUpperCase()}. Every single word must be in ${config.llmName}. Your output must be valid JSON.`.trim();
}
