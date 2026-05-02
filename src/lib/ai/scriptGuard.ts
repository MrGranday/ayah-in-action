/**
 * scriptGuard.ts — Layer 7: Script Validation
 *
 * Detects language contamination in AI responses before rendering.
 * For Arabic-script languages (ar/ur/fa), uses script-specific character
 * patterns to catch cross-contamination that ratio alone cannot catch.
 */

// Primary script patterns — used for ratio-based validation
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

/**
 * Urdu-specific characters not present in standard Arabic.
 * If at least some of these appear, the response is likely Urdu.
 * Pattern: ٹ پ چ ڈ ڑ ژ گ ں ھ ہ ی ے
 */
const URDU_UNIQUE_CHARS = /[\u0679\u067E\u0686\u0688\u0691\u0698\u06AF\u06BA\u06BE\u06C1\u06CC\u06D2]/g;

/**
 * Persian-specific characters not present in standard Arabic.
 * Pattern: پ چ ژ گ + some extended forms
 */
const PERSIAN_UNIQUE_CHARS = /[\u067E\u0686\u0698\u06AF]/g;

/**
 * Cross-contamination check for Arabic-script languages (ar/ur/fa).
 * Returns true if the response appears to be in the WRONG script language.
 */
function detectArabicScriptCrossContamination(
  text: string,
  targetIso: string
): boolean {
  if (targetIso !== 'ar' && targetIso !== 'ur' && targetIso !== 'fa') return false;

  const urduMatches = (text.match(URDU_UNIQUE_CHARS) || []).length;
  const persianMatches = (text.match(PERSIAN_UNIQUE_CHARS) || []).length;
  const totalArabicBlock = (text.match(/[\u0600-\u06FF]/g) || []).length;

  if (totalArabicBlock === 0) return false;

  const urduRatio = urduMatches / totalArabicBlock;
  const persianRatio = persianMatches / totalArabicBlock;

  if (targetIso === 'ur') {
    // Urdu response should have a meaningful ratio of Urdu-unique chars
    // If it's very low AND total script chars are high, it's likely Arabic not Urdu
    return urduRatio < 0.04 && totalArabicBlock > 50;
  }

  if (targetIso === 'fa') {
    // Persian response should have Persian-unique chars
    return persianRatio < 0.02 && totalArabicBlock > 50;
  }

  if (targetIso === 'ar') {
    // Arabic response should NOT have many Urdu-unique chars
    return urduRatio > 0.08;
  }

  return false;
}

/**
 * Primary validation — checks both ratio and cross-contamination.
 */
export function validateResponseScript(
  text: string,
  isoCode: string
): { valid: boolean; ratio: number; crossContaminated: boolean } {
  const pattern = SCRIPT_PATTERNS[isoCode];
  if (!pattern) return { valid: true, ratio: 1, crossContaminated: false };
  const stripped = text.replace(/\s/g, '');
  if (!stripped.length) return { valid: true, ratio: 1, crossContaminated: false };

  const matches = (stripped.match(pattern) || []).length;
  const ratio = matches / stripped.length;
  const minRatio = MIN_RATIOS[isoCode] ?? 0.55;

  const crossContaminated = detectArabicScriptCrossContamination(text, isoCode);
  const valid = ratio >= minRatio && !crossContaminated;

  return { valid, ratio, crossContaminated };
}

/**
 * withScriptValidation — wraps an AI call with up to 3 validation attempts.
 * BUG FIX: Previously only retried once and returned the unvalidated result.
 * Now: validates after EACH attempt. Returns the best valid result or the
 * last attempt if all fail (never silently returns bad output without logging).
 */
export async function withScriptValidation(
  response: string,
  isoCode: string,
  retryFn: () => Promise<string>
): Promise<string> {
  // Attempt 0 — the initial response
  const check0 = validateResponseScript(response, isoCode);
  if (check0.valid) return response;

  console.warn(
    `[ScriptGuard] Attempt 1 FAILED for ${isoCode}. ratio=${check0.ratio.toFixed(2)}, crossContaminated=${check0.crossContaminated}. Retrying...`
  );

  // Attempt 1 — first retry
  const retry1 = await retryFn();
  const check1 = validateResponseScript(retry1, isoCode);
  if (check1.valid) return retry1;

  console.warn(
    `[ScriptGuard] Attempt 2 FAILED for ${isoCode}. ratio=${check1.ratio.toFixed(2)}, crossContaminated=${check1.crossContaminated}. Retrying one final time...`
  );

  // Attempt 2 — final retry
  const retry2 = await retryFn();
  const check2 = validateResponseScript(retry2, isoCode);

  if (!check2.valid) {
    console.error(
      `[ScriptGuard] All 3 attempts FAILED for ${isoCode}. Returning last attempt. ratio=${check2.ratio.toFixed(2)}, crossContaminated=${check2.crossContaminated}`
    );
  }

  return retry2;
}
