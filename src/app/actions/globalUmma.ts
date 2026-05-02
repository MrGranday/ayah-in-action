'use server';

import { getServerSession } from '@/lib/session';
import { buildLanguageSystemBlock, buildLangAuditDescription } from '@/lib/ai/languageInstruction';
import { wrapUserPrompt } from '@/lib/ai/wrapUserPrompt';
import { withScriptValidation } from '@/lib/ai/scriptGuard';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * generateGlobalUmmaInsight
 * Provides high-level spiritual insights about the global Ummah's state.
 * Mandatory Layer 6 AI Feature.
 */
export async function generateGlobalUmmaInsight() {
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

  const { getLanguageConfig } = await import('@/config/languageConfig');
  const config = getLanguageConfig(isoCode);

  const SYSTEM_PROMPT = `${buildLanguageSystemBlock(isoCode)}

You are 'The Global Ummah' analyst. Your goal is to provide a brief, insightful, and poetic reflection on the collective spiritual journey of the Ummah today.

Rules:
- Focus on themes of unity, perseverance, and global connection.
- Use native Islamic terminology appropriate for ${config.llmName}.
- Respond strictly in JSON.

Format:
{
  "_lang_audit": "${buildLangAuditDescription(isoCode)}",
  "insight": "A 2-3 sentence poetic reflection in ${config.llmName}...",
  "theme": "A single word theme in ${config.llmName} (e.g., Unity, Patience, Hope)"
}`;

  const userMsg = wrapUserPrompt("Provide a global spiritual insight for the Ummah today.", isoCode);

  const callModel = async () => {
    let text = '';
    if (model === 'claude') {
      const anthropic = new Anthropic({ apiKey: key! });
      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMsg }],
      });
      text = (response.content[0] as { text: string }).text || '';
    } else if (model === 'gpt4o' || model === 'groq' || model === 'hf') {
      const isGroq = model === 'groq';
      const isHf = model === 'hf';
      const openai = new OpenAI({ 
        apiKey: key!,
        baseURL: isGroq ? 'https://api.groq.com/openai/v1' : isHf ? 'https://api-inference.huggingface.co/v1/' : undefined 
      });
      const completion = await openai.chat.completions.create({
        model: isGroq ? 'llama-3.1-8b-instant' : isHf ? 'meta-llama/Meta-Llama-3-8B-Instruct' : 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMsg }
        ],
        response_format: { type: 'json_object' }
      });
      text = completion.choices[0].message.content || '{}';
    } else if (model === 'gemini') {
      const genAI = new GoogleGenerativeAI(key!);
      const geminiModel = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: { responseMimeType: 'application/json' }
      });
      const result = await geminiModel.generateContent(userMsg);
      text = result.response.text();
    }
    return text;
  };

  try {
    const rawResult = await withScriptValidation(await callModel(), isoCode, callModel);
    const data = JSON.parse(rawResult.match(/\{.*\}/s)?.[0] || rawResult);
    return { data };
  } catch (err) {
    console.error('[GlobalUmma] Error:', err);
    return { error: 'Failed to generate insight' };
  }
}
