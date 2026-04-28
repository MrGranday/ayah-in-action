const SCRIPT_PATTERNS: Record<string, RegExp> = {
  ar: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g,
  ur: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g,
  fa: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g,
  bn: /[\u0980-\u09FF]/g,
  ru: /[\u0400-\u04FF]/g,
  zh: /[\u4E00-\u9FFF]/g,
  en: /[a-zA-Z]/g,
  tr: /[a-zA-ZçğıöşüÇĞIÖŞÜ]/g,
  id: /[a-zA-Z]/g,
  fr: /[a-zA-ZàâäéèêëïîôöùûüÿçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]/g,
  es: /[a-zA-ZñÑáéíóúÁÉÍÓÚ]/g,
};

const MIN_RATIOS: Record<string, number> = {
  ar: 0.55,
  ur: 0.55,
  fa: 0.55,
  bn: 0.55,
  ru: 0.55,
  zh: 0.20, // Chinese characters represent whole words
  en: 0.55,
  tr: 0.55,
  id: 0.55,
  fr: 0.55,
  es: 0.55,
};

export function validateResponseScript(text: string, isoCode: string):
  { valid: boolean; ratio: number } {
  const pattern = SCRIPT_PATTERNS[isoCode];
  if (!pattern) return { valid: true, ratio: 1 };
  const stripped = text.replace(/\s/g, '');
  if (!stripped.length) return { valid: true, ratio: 1 };
  const matches = (stripped.match(pattern) || []).length;
  const ratio = matches / stripped.length;
  return { valid: ratio >= (MIN_RATIOS[isoCode] ?? 0.55), ratio };
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
