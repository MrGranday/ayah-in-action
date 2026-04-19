'use server';

import { getServerSession } from '@/lib/session';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { ProcessedVerse } from '@/types/quran';

/**
 * TOOLS for the LLM to call during the guidance generation process.
 * These map to the Quran Foundation / Quran.com public APIs.
 */

async function searchQuran(query: string) {
  try {
    const response = await fetch(`https://api.quran.com/api/v4/search?q=${encodeURIComponent(query)}&size=3`);
    if (!response.ok) return '[]';
    const data = await response.json();
    return JSON.stringify(data.search?.results || []);
  } catch { return '[]'; }
}

async function getVerseDetails(verseKey: string) {
  try {
    const session = await import('@/lib/session').then(m => m.getServerSession());
    const tId = session.translationResourceId || 131;
    const response = await fetch(`https://api.quran.com/api/v4/verses/by_key/${verseKey}?text_uthmani=true&translations=${tId}&audio=7`);
    if (!response.ok) return '{}';
    const data = await response.json();
    return JSON.stringify(data.verse || {});
  } catch { return '{}'; }
}

async function getTafsir(verseKey: string) {
  try {
    const response = await fetch(`https://api.quran.com/api/v4/tafsirs/169/by_verse_key/${verseKey}`);
    if (!response.ok) return '{}';
    const data = await response.json();
    return JSON.stringify(data.tafsir || {});
  } catch { return '{}'; }
}

/** Dispatch a tool call by name and arguments */
async function dispatchTool(name: string, args: Record<string, string>): Promise<string> {
  if (name === 'search_quran') return await searchQuran(args.query);
  if (name === 'get_verse_details') return await getVerseDetails(args.verse_key);
  if (name === 'get_tafsir') return await getTafsir(args.verse_key);
  return '{}';
}

/**
 * Helper to fetch full verse metadata for the final ProcessedVerse object.
 * This version uses the proven single-fetch logic from the Sanctuary (Dashboard)
 * which handles text, translations (with Sahih fallback), and audio in one go.
 */
async function fetchFullVerseDetails(verseKey: string): Promise<Partial<ProcessedVerse>> {
  const session = await getServerSession();
  const tId = session.translationResourceId || 131;
  const isoCode = session.isoCode || 'en';
  
  const [chapterId, verseNumber] = verseKey.split(':');
  
  try {
    // Stage 1: Fetch Chapter info (for localized names)
    const chapRes = await fetch(`https://api.quran.com/api/v4/chapters/${chapterId}?language=${isoCode}`);
    // Stage 2: Fetch Verse data (Arabic, Translatable texts)
    const verseRes = await fetch(`https://api.quran.com/api/v4/verses/by_key/${verseKey}?translations=${tId},20&audio=1&fields=text_uthmani,text_uthmani_simple`, { cache: 'no-store' });

    if (!chapRes.ok || !verseRes.ok) throw new Error("API Connection Error");

    const chapData = await chapRes.json();
    const verseData = await verseRes.json();
    const verse = verseData.verse;

    // Translation logic: Take the first available translation and strip HTML tags
    const translationText = verse.translations?.[0]?.text || '';

    return {
      verse_key: verseKey,
      chapter_id: parseInt(chapterId),
      verse_number: parseInt(verseNumber),
      text_uthmani: String(verse.text_uthmani || verse.text_uthmani_simple || ''),
      translation: translationText.replace(/<[^>]*>?/gm, ''), 
      // Ensure the audio URL is absolute
      audio_url: verse.audio?.url ? (verse.audio.url.startsWith('http') ? verse.audio.url : `https://verses.quran.com/${verse.audio.url}`) : '',
      chapter_name_arabic: String(chapData.chapter?.name_arabic || ''),
      chapter_name_english: String(chapData.chapter?.name_simple || ''),
    };
  } catch (error) {
    console.error("Grounded metadata fetch failed:", error);
    // Return at least the verse key so the UI knows which verse failed
    return { verse_key: verseKey };
  }
}

// ─── Anthropic-format tool definitions ──────────────────────────────────────
const TOOLS_ANTHROPIC = [
  {
    name: 'search_quran',
    description: 'Search the Quran for verses relevant to a specific topic or challenge.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'The search query (e.g., "patience in hardship")' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_verse_details',
    description: 'Retrieve the Arabic text, translation, and metadata for a specific verse key (e.g., "2:153").',
    input_schema: {
      type: 'object' as const,
      properties: {
        verse_key: { type: 'string', description: 'The verse key in format "chapter:verse"' }
      },
      required: ['verse_key']
    }
  },
  {
    name: 'get_tafsir',
    description: 'Retrieve a detailed explanation (tafsir) for a specific verse key.',
    input_schema: {
      type: 'object' as const,
      properties: {
        verse_key: { type: 'string', description: 'The verse key in format "chapter:verse"' }
      },
      required: ['verse_key']
    }
  }
];

// ─── OpenAI-format tool definitions ─────────────────────────────────────────
const TOOLS_OPENAI = TOOLS_ANTHROPIC.map(t => ({
  type: 'function' as const,
  function: { name: t.name, description: t.description, parameters: t.input_schema }
}));

// ─── Gemini-format function declarations ─────────────────────────────────────
const TOOLS_GEMINI: FunctionDeclaration[] = [
  {
    name: 'search_quran',
    description: 'Search the Quran for verses relevant to a specific topic or challenge.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: { type: SchemaType.STRING, description: 'The search query (e.g., "patience in hardship")' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_verse_details',
    description: 'Retrieve the Arabic text, translation, and metadata for a specific verse key (e.g., "2:153").',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        verse_key: { type: SchemaType.STRING, description: 'The verse key in format "chapter:verse"' }
      },
      required: ['verse_key']
    }
  },
  {
    name: 'get_tafsir',
    description: 'Retrieve a detailed explanation (tafsir) for a specific verse key.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        verse_key: { type: SchemaType.STRING, description: 'The verse key in format "chapter:verse"' }
      },
      required: ['verse_key']
    }
  }
];



/** 
 * SYNTHESIS_PROMPT: Used for Phase 2 of Groq/HF generation.
 * This instructs the model to take the gathered tool data and finalize the JSON output.
 */
const SYNTHESIS_PROMPT = `Based on the Quranic search results and Tafsir provided in the conversation history, finalize the spiritual guidance. 
You MUST output strictly a JSON object with this structure:
{ "verse_key": "...", "guidance": "...", "reflection": "..." }
Do not provide any conversational text before or after the JSON.`;

export async function generateWhisper(challenge: string) {
  const session = await getServerSession();
  const model = session.preferredModel || 'claude';
  
  const { getLanguageInstruction } = await import('@/lib/ai/languageInstruction');
  const SYSTEM_PROMPT = `${getLanguageInstruction(session.isoCode || 'en', session.direction || 'ltr')}You are 'The Whisper', a compassionate spiritual guide for the Ayah in Action app. Your goal is to provide grounded Quranic guidance for a user's life challenge.

IMPORTANT: You MUST use the search_quran tool to find relevant verses. Do not rely solely on your internal knowledge. Once you find a verse, use get_verse_details and get_tafsir to provide a deeply grounded explanation.

Output your final response in this exact JSON structure:
{ "verse_key": "...", "guidance": "A short, empathetic explanation of why this verse applies", "reflection": "A daily application prompt for the user" }`;

  // ─── Resolve the correct API key ──────────────────────────────────────────
  let key: string | undefined;
  if (model === 'claude') key = session.claudeKey;
  else if (model === 'gpt4o') key = session.openaiKey;
  else if (model === 'gemini') key = session.geminiKey;
  else if (model === 'groq') key = session.groqKey;
  else if (model === 'hf') key = session.hfKey;

  if (!key) {
    return { error: 'API Key not found. Please configure it in Settings.' };
  }

  // Return an advisory notice when a free-tier compatible model is selected
  const freeTierNotice = model === 'gemini' || model === 'groq' || model === 'hf';

  try {
    let finalJson: { verse_key: string; guidance: string; reflection: string; verseKey?: string; verse?: string; } | null = null;

    // ═══════════════════════════════════════════════════════════════════════
    // PROVIDER: Claude (Anthropic)
    // ═══════════════════════════════════════════════════════════════════════
    if (model === 'claude') {
      const anthropic = new Anthropic({ apiKey: key });
      const messages: any[] = [{ role: 'user', content: challenge }];

      let turns = 0;
      while (turns < 5) {
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages,
          tools: TOOLS_ANTHROPIC
        });

        if (response.stop_reason === 'tool_use') {
          messages.push({ role: 'assistant', content: response.content });

          const toolResults = await Promise.all(
            response.content.map(async (block) => {
              if (block.type !== 'tool_use') return null;
              const result = await dispatchTool(block.name, block.input as Record<string, string>);
              return {
                type: 'tool_result' as const,
                tool_use_id: block.id,
                content: result
              };
            })
          );

          messages.push({ role: 'user', content: toolResults.filter(r => r !== null) });
          turns++;
        } else {
          const textBlock = response.content.find(c => c.type === 'text') as any;
          const jsonMatch = textBlock?.text.match(/\{.*\}/s);
          if (jsonMatch) finalJson = JSON.parse(jsonMatch[0]);
          break;
        }
      }

    // ═══════════════════════════════════════════════════════════════════════
    // PROVIDER: GPT-4o (OpenAI)
    // ═══════════════════════════════════════════════════════════════════════
    } else if (model === 'gpt4o') {
      const openai = new OpenAI({ apiKey: key });
      const messages: any[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: challenge }
      ];

      let turns = 0;
      // standard multi-turn loop for OpenAI
      while (turns < 5) {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          tools: TOOLS_OPENAI as any,
          response_format: { type: 'json_object' }
        });

        const choice = completion.choices[0];
        if (choice.message.tool_calls) {
          messages.push(choice.message);

          for (const toolCall of choice.message.tool_calls as any[]) {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await dispatchTool(toolCall.function.name, args);
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: result
            });
          }
          turns++;
        } else {
          finalJson = JSON.parse(choice.message.content || '{}');
          break;
        }
      }

    // ═══════════════════════════════════════════════════════════════════════
    // PROVIDER: Groq / Hugging Face (OpenAI-compatible) -> TWO-STAGE PIPELINE
    // ═══════════════════════════════════════════════════════════════════════
    } else if (model === 'groq' || model === 'hf') {
      const isGroq = model === 'groq';
      // Initialize the OpenAI client with provider-specific base URLs
      const openai = new OpenAI({ 
        apiKey: key,
        baseURL: isGroq ? 'https://api.groq.com/openai/v1' : 'https://api-inference.huggingface.co/v1/'
      });

      // Phase 1: Knowledge Gathering (Retrieve data from Quran APIs)
      const messages: any[] = [
        { role: 'system', content: SYSTEM_PROMPT + "\nFOCUS: Use your tools to gather all necessary Quranic info first." },
        { role: 'user', content: challenge }
      ];

      let turns = 0;
      let internalRetries = 0;
      // Loop up to 5 times to allow for multi-turn tool usage (search -> details -> tafsir)
      while (turns < 5 && internalRetries < 3) {
        let completion;
        try {
          completion = await openai.chat.completions.create({
            model: isGroq ? 'llama-3.3-70b-versatile' : 'meta-llama/Meta-Llama-3-70B-Instruct',
            messages,
            tools: TOOLS_OPENAI as any,
            tool_choice: "auto",
          });
        } catch (err: any) {
          // Self-healing for potential Groq tool-formatting hallucinations
          if (isGroq && err.status === 400 && err.error?.code === 'tool_use_failed') {
            internalRetries++;
            messages.push({
              role: 'user',
              content: 'CRITICAL FORMATTING ERROR: Use native JSON tool payloads, not plain text tags.'
            });
            continue;
          }
          throw err;
        }

        const choice = completion.choices[0];
        // If the LLM wants to use a tool, execute it and add to history
        if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
          messages.push(choice.message);

          for (const toolCall of choice.message.tool_calls as any[]) {
            const argsString = toolCall.function.arguments;
            const args = typeof argsString === 'string' ? JSON.parse(argsString) : argsString;
            // dispatchTool calls the actual Quran Foundation APIs
            const result = await dispatchTool(toolCall.function.name, args);
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: result
            });
          }
          turns++;
        } else {
          // Tools exhausted. LLM has finished gathering info.
          break;
        }
      }

      // Phase 2: Synthesis (Convert gathered API knowledge into final JSON)
      // This final call has NO tools enabled, preventing any further hallucination.
      const synthesisResponse = await openai.chat.completions.create({
        model: isGroq ? 'llama-3.3-70b-versatile' : 'meta-llama/Meta-Llama-3-70B-Instruct',
        messages: [
          ...messages,
          { role: 'user', content: SYNTHESIS_PROMPT }
        ],
        response_format: isGroq ? { type: 'json_object' } : undefined
      });

      const finalContent = synthesisResponse.choices[0].message.content || '{}';
      const jsonMatch = finalContent.match(/\{[\s\S]*\}/);
      try {
        finalJson = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(finalContent);
      } catch (e) {
        // Safe fallback in case JSON parsing fails
        finalJson = {} as any;
      }

    // ═══════════════════════════════════════════════════════════════════════
    // PROVIDER: Gemini (Google)
    // Note: Works for basic Whisper functionality. For the richest grounded
    // experience (multi-turn tool chaining, tafsir depth), OpenAI or
    // Anthropic keys are recommended.
    // ═══════════════════════════════════════════════════════════════════════
    } else if (model === 'gemini') {
      const genAI = new GoogleGenerativeAI(key);
      const geminiModel = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: TOOLS_GEMINI }]
      });

      // Start a chat session so we can do multi-turn tool calling
      const chat = geminiModel.startChat();

      let turns = 0;
      while (turns < 5) {
        const userMsg = turns === 0 ? challenge : 'Continue and provide the final JSON guidance.';
        const result = await chat.sendMessage(userMsg);
        const response = result.response;

        // Check if the model wants to call functions
        const functionCalls = response.functionCalls();

        if (functionCalls && functionCalls.length > 0) {
          // Execute all requested tool calls
          const functionResponses = await Promise.all(
            functionCalls.map(async (fc) => {
              const toolResult = await dispatchTool(fc.name, fc.args as Record<string, string>);
              return {
                functionResponse: {
                  name: fc.name,
                  response: { result: toolResult }
                }
              };
            })
          );

          // Feed results back to the model
          await chat.sendMessage(functionResponses as any);
          turns++;
        } else {
          // No more tool calls — extract the final text response
          const text = response.text();
          const jsonMatch = text.match(/\{.*\}/s);
          if (jsonMatch) {
            try {
              finalJson = JSON.parse(jsonMatch[0]);
            } catch {
              throw new Error('Gemini returned malformed JSON. Please try again.');
            }
          }
          break;
        }
      }
    }

    // Normalize keys just in case the LLM capitalized them
    if (finalJson && !finalJson.verse_key && finalJson.verseKey) finalJson.verse_key = finalJson.verseKey;
    if (finalJson && !finalJson.verse_key && finalJson.verse) finalJson.verse_key = finalJson.verse;

    // ─── Validate result or inject graceful fallback ───────────────────────
    if (!finalJson || !finalJson.verse_key) {
      console.warn("Model failed to output a verse_key, injecting a gentle fallback.");
      finalJson = {
        verse_key: "94:5",
        guidance: "A brief spiritual discontinuity interrupted the connection. This verse has been drawn for you universally: Indeed, with hardship comes ease.",
        reflection: "Take a deep breath. Know that whatever you are facing is temporary. You may resubmit your question when you are ready."
      };
    }

    // Post-generation: fetch full Quranic metadata for the ProcessedVerse
    const cleanVerseKey = finalJson.verse_key.trim();
    const metadata = await fetchFullVerseDetails(cleanVerseKey);

    const finalVerse = {
      verse_key: finalJson.verse_key.trim(),
      chapter_id: metadata.chapter_id || 0,
      verse_number: metadata.verse_number || 0,
      arabic: metadata.text_uthmani || '',
      translation: metadata.translation || '',
      guidance: finalJson.guidance || '',
      reflection: finalJson.reflection || '',
      audio_url: metadata.audio_url || '',
      chapter_name_arabic: metadata.chapter_name_arabic || '',
      chapter_name_english: metadata.chapter_name_english || '',
    };

    return { data: finalVerse, freeTierNotice };

  } catch (error: any) {
    console.error('Whisper generation failed:', error);
    
    let errorMessage = error.message || 'Failed to generate guidance. Please check your API key.';

    if (model === 'gemini' && errorMessage.includes('limit: 0')) {
      errorMessage = 'Gemini API Error: Your Free Tier quota limit is literally 0. This happens if you are in a region where Google disables the free tier (like EU/UK), or if your API key requires a billing account to activate. Please use an OpenAI or Anthropic key instead.';
    } else if (model === 'gemini' && errorMessage.includes('429 Too Many Requests')) {
      errorMessage = 'Gemini free-tier quota exceeded (15 requests/minute). Tool-chaining uses multiple requests per generation. Please try again in 1 minute, or switch to Anthropic or OpenAI.';
    } else if (model === 'groq' && errorMessage.includes('429')) {
      errorMessage = 'Groq rate limit exceeded. Groq has strict tokens-per-minute limits for free tier. Please try again in a minute.';
    } else if (errorMessage.includes('loading') || errorMessage.includes('503')) {
      errorMessage = 'The language model is currently loading (cold start) or overloaded. It usually takes 10-20 seconds. Please try again!';
    } else if (errorMessage.includes('Failed to call a function') || errorMessage.includes('tool_use_failed')) {
      errorMessage = 'Groq encountered a formatting syntax error while executing semantic search tools. Please slightly rephrase your challenge and try again.';
    } else if (errorMessage.includes('Unexpected token') || errorMessage.includes('<!DOCTYPE')) {
      errorMessage = 'The API proxy or our Quran database temporarily went offline and returned an invalid response. Please try again.';
    } else if (errorMessage.includes('quota') || errorMessage.includes('429')) {
      errorMessage = 'API rate limit or quota exceeded for your selected model. Please wait a moment or check your billing plan.';
    }

    return { error: errorMessage };
  }
}
