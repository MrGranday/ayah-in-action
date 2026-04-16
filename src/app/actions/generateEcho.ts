'use server';

import { getServerSession } from '@/lib/session';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * The Echo prompt — instructs the LLM to write one poetic sentence.
 * This is intentionally minimal: no tool calls needed, just pure creative writing.
 */
const ECHO_PROMPT = `You are a poetic spiritual writer for the Ayah in Action app.
The user has just applied a Quranic verse to their real life and written a personal reflection.
Your task: Write EXACTLY ONE beautiful, poetic sentence that captures the essence of this transformation.

Rules:
- Output ONLY the single sentence. No quotation marks. No preamble. No explanation.
- Write in third person or timeless voice (not "I" or "you")
- Use evocative, literary language — metaphor, imagery, spiritual weight
- The sentence must feel like a personal spiritual memoir entry, not a generic statement
- Maximum 40 words

Example outputs:
"In the silence between a raised voice and a patient breath, the Word became a shield."
"What began as frustration dissolving into morning became the soil in which gratitude quietly took root."`;

function buildUserMessage(logText: string, categories: string[], verseKey: string): string {
  return `Verse: ${verseKey}
Categories: ${categories.join(', ')}
Reflection: ${logText}

Generate the Echo:`;
}

/**
 * Generates a poetic "Echo" sentence for a given application log entry.
 * Uses the user's configured preferred model from session.
 * 
 * This is designed to be called with a timeout wrapper — if it takes
 * longer than 5 seconds, the caller should gracefully skip.
 */
export async function generateEcho(params: {
  logText: string;
  categories: string[];
  verseKey: string;
}): Promise<{ echo: string } | { error: string }> {
  const { logText, categories, verseKey } = params;

  try {
    const session = await getServerSession();
    const model = session.preferredModel || 'claude';

    // Resolve API key
    let key: string | undefined;
    if (model === 'claude') key = session.claudeKey;
    else if (model === 'gpt4o') key = session.openaiKey;
    else if (model === 'gemini') key = session.geminiKey;
    else if (model === 'groq') key = session.groqKey;
    else if (model === 'hf') key = session.hfKey;

    if (!key) {
      // No key configured — silently skip echo generation
      return { error: 'no_key' };
    }

    const userMsg = buildUserMessage(logText, categories, verseKey);

    // ── Claude ────────────────────────────────────────────────────────────────
    if (model === 'claude') {
      const anthropic = new Anthropic({ apiKey: key });
      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022', // Fast, low-cost model for echo
        max_tokens: 100,
        system: ECHO_PROMPT,
        messages: [{ role: 'user', content: userMsg }],
      });
      const text = (response.content[0] as any)?.text?.trim() || '';
      return { echo: text };
    }

    // ── GPT-4o ────────────────────────────────────────────────────────────────
    if (model === 'gpt4o') {
      const openai = new OpenAI({ apiKey: key });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Fast, low-cost model for echo
        max_tokens: 100,
        messages: [
          { role: 'system', content: ECHO_PROMPT },
          { role: 'user', content: userMsg },
        ],
      });
      const text = completion.choices[0]?.message?.content?.trim() || '';
      return { echo: text };
    }

    // ── Gemini ────────────────────────────────────────────────────────────────
    if (model === 'gemini') {
      const genAI = new GoogleGenerativeAI(key);
      const geminiModel = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: ECHO_PROMPT,
      });
      const result = await geminiModel.generateContent(userMsg);
      const text = result.response.text()?.trim() || '';
      return { echo: text };
    }

    // ── Groq / Hugging Face (OpenAI-compatible) ───────────────────────────────
    if (model === 'groq' || model === 'hf') {
      const isGroq = model === 'groq';
      const openai = new OpenAI({
        apiKey: key,
        baseURL: isGroq
          ? 'https://api.groq.com/openai/v1'
          : 'https://api-inference.huggingface.co/v1/',
      });
      const completion = await openai.chat.completions.create({
        model: isGroq ? 'llama-3.1-8b-instant' : 'meta-llama/Meta-Llama-3-8B-Instruct',
        max_tokens: 100,
        messages: [
          { role: 'system', content: ECHO_PROMPT },
          { role: 'user', content: userMsg },
        ],
      });
      const text = completion.choices[0]?.message?.content?.trim() || '';
      return { echo: text };
    }

    return { error: 'unknown_model' };
  } catch (err: any) {
    console.warn('[generateEcho] Failed silently:', err?.message || err);
    return { error: err?.message || 'generation_failed' };
  }
}
