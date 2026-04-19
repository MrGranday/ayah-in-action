export function getLanguageInstruction(isoCode?: string, direction?: string) {
  if (!isoCode || isoCode === 'en') return '';
  return `CRITICAL: You must respond ENTIRELY in the language with ISO code "${isoCode}". 
Every single word of your response must be in this language. 
${direction === 'rtl' ? 'This is a right-to-left language. Structure your response accordingly.' : ''}
Do not include any English unless the user wrote in English.\n\n`;
}
