import { getLanguageConfig } from '@/config/languageConfig';

/**
 * wrapUserPrompt
 * Wraps user input in language-specific instructions to reinforce the lock.
 */
export function wrapUserPrompt(challenge: string, isoCode: string): string {
  const config = getLanguageConfig(isoCode);
  return `
USER CHALLENGE:
"${challenge}"

INSTRUCTION:
Respond to the above challenge in ${config.llmName} using the specific Quranic guidance process. 
Reminder: Your response MUST be valid JSON and strictly in ${config.llmName}.
`.trim();
}
