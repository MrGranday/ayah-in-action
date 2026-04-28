'use server';

import { getServerSession } from '@/lib/session';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

import { getLanguageConfig } from '@/config/languageConfig';
import { buildLanguageSystemBlock } from '@/lib/ai/languageInstruction';
import { withScriptValidation } from '@/lib/ai/scriptGuard';

/**
 * The Echo prompt — instructs the LLM to write one poetic sentence.
 */
function buildEchoPrompt(isoCode: string): string {
  const config = getLanguageConfig(isoCode);
  const langLock = buildLanguageSystemBlock(isoCode);
  const { buildLangAuditDescription } = require('@/lib/ai/languageInstruction');
  
  return `
${langLock}

You are a poetic spiritual writer for the Ayah in Action app.
The user has just applied a Quranic verse to their real life and written a personal reflection.
Your task: Write EXACTLY ONE beautiful, poetic sentence that captures the essence of this transformation.

Rules:
- Output ONLY the single sentence. No quotation marks. No preamble. No explanation.
- Write in third person or timeless voice (not "I" or "you")
- Use evocative, literary language in ${config.llmName} — metaphor, imagery, spiritual weight
- The sentence must feel like a personal spiritual memoir entry, not a generic statement
- Maximum 40 words
- STRICT: The entire sentence MUST be in ${config.llmName}. No English fallback.

Example Output Format:
{
  "_lang_audit": "${buildLangAuditDescription(isoCode)}",
  "echo": "..."
}
`.trim();
}


function buildUserMessage(logText: string, categories: string[], verseKey: string): string {
  return `Verse: ${verseKey}
Categories: ${categories.join(', ')}
Reflection: ${logText}

Generate the Echo JSON:`;
}

export async function generateEcho(params: {
  logText: string;
  categories: string[];
  verseKey: string;
}): Promise<{ echo: string } | { error: string }> {
  const { logText, categories, verseKey } = params;

  try {
    const session = await getServerSession();
    const isoCode = session.isoCode || 'en';
    const model = session.preferredModel || 'claude';

    // Resolve API key
    let key: string | undefined;
    if (model === 'claude') key = session.claudeKey;
    else if (model === 'gpt4o') key = session.openaiKey;
    else if (model === 'gemini') key = session.geminiKey;
    else if (model === 'groq') key = session.groqKey;
    else if (model === 'hf') key = session.hfKey;

    if (!key) return { error: 'no_key' };

    const systemPrompt = buildEchoPrompt(isoCode);
    const userMsg = buildUserMessage(logText, categories, verseKey);

    const callModel = async () => {
      let text = '';
      if (model === 'claude') {
        const anthropic = new Anthropic({ apiKey: key! });
        const response = await anthropic.messages.create({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 200,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMsg }],
        });
        text = (response.content[0] as { text: string }).text?.trim() || '';
      } else if (model === 'gpt4o') {
        const openai = new OpenAI({ apiKey: key! });
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          max_tokens: 200,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMsg },
          ],
        });
        text = completion.choices[0]?.message?.content?.trim() || '';
      } else if (model === 'gemini') {
        const genAI = new GoogleGenerativeAI(key!);
        const geminiModel = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          systemInstruction: systemPrompt,
          generationConfig: { responseMimeType: 'application/json' }
        });
        const result = await geminiModel.generateContent(userMsg);
        text = result.response.text()?.trim() || '';
      } else if (model === 'groq' || model === 'hf') {
        const isGroq = model === 'groq';
        const openai = new OpenAI({
          apiKey: key!,
          baseURL: isGroq ? 'https://api.groq.com/openai/v1' : 'https://api-inference.huggingface.co/v1/',
        });
        const completion = await openai.chat.completions.create({
          model: isGroq ? 'llama-3.1-8b-instant' : 'meta-llama/Meta-Llama-3-8B-Instruct',
          max_tokens: 200,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMsg },
          ],
        });
        text = completion.choices[0]?.message?.content?.trim() || '';
      }

      try {
        const parsed = JSON.parse(text);
        return parsed.echo || '';
      } catch {
        return text.length < 100 ? text : ''; // Fallback for raw text
      }
    };

    const finalEcho = await withScriptValidation(await callModel(), isoCode, callModel);
    return { echo: finalEcho };
    
  } catch (err: unknown) {
    console.warn('[generateEcho] Failed:', err instanceof Error ? err.message : err);
    return { error: err instanceof Error ? err.message : 'generation_failed' };
  }
}
