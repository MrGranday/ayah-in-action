'use server';

import { getServerSession } from '@/lib/session';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { ProcessedVerse } from '@/types/quran';

/**
 * TOOLS for the LLM to call during the guidance generation process.
 * These map to the Quran Foundation / Quran.com public APIs.
 */

async function searchQuran(query: string) {
  const response = await fetch(`https://api.quran.com/api/v4/search?q=${encodeURIComponent(query)}&size=3`);
  const data = await response.json();
  return JSON.stringify(data.search?.results || []);
}

async function getVerseDetails(verseKey: string) {
  const response = await fetch(`https://api.quran.com/api/v4/verses/by_key/${verseKey}?text_uthmani=true&translations=131&audio=7`);
  const data = await response.json();
  return JSON.stringify(data.verse || {});
}

async function getTafsir(verseKey: string) {
  const response = await fetch(`https://api.quran.com/api/v4/tafsirs/169/by_verse_key/${verseKey}`);
  const data = await response.json();
  return JSON.stringify(data.tafsir || {});
}

/**
 * Helper to fetch full verse metadata for the final ProcessedVerse object.
 */
async function fetchFullVerseDetails(verseKey: string): Promise<Partial<ProcessedVerse>> {
  const [chapterId, verseNumber] = verseKey.split(':');
  
  const [chapRes, verseRes] = await Promise.all([
    fetch(`https://api.quran.com/api/v4/chapters/${chapterId}`),
    fetch(`https://api.quran.com/api/v4/verses/by_key/${verseKey}?translations=131&audio=7&fields=text_uthmani`)
  ]);

  if (!chapRes.ok || !verseRes.ok) return {};

  const chapData = await chapRes.json();
  const verseData = await verseRes.json();
  const verse = verseData.verse;

  return {
    verse_key: verseKey,
    chapter_id: parseInt(chapterId),
    verse_number: parseInt(verseNumber),
    text_uthmani: verse.text_uthmani,
    translation: verse.translations?.[0]?.text?.replace(/<[^>]*>?/gm, '') || '',
    audio_url: verse.audio?.url ? (verse.audio.url.startsWith('http') ? verse.audio.url : `https://verses.quran.com/${verse.audio.url}`) : '',
    chapter_name_arabic: chapData.chapter?.name_arabic || '',
    chapter_name_english: chapData.chapter?.name_simple || '',
  };
}

const TOOLS = [
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

export async function generateWhisper(challenge: string) {
  const session = await getServerSession();
  const model = session.preferredModel || 'claude';
  const key = model === 'claude' ? session.claudeKey : session.openaiKey;

  if (!key) {
    return { error: 'API Key not found. Please configure it in Settings.' };
  }

  try {
    let finalJson: any = null;

    if (model === 'claude') {
      const anthropic = new Anthropic({ apiKey: key });
      const messages: any[] = [{ role: 'user', content: challenge }];
      const systemPrompt = "You are 'The Whisper', a compassionate spiritual guide for the Ayah in Action app. Your goal is to provide grounded Quranic guidance for a user's life challenge. \n\nIMPORTANT: You MUST use the search_quran tool to find relevant verses. Do not rely solely on your internal knowledge. Once you find a verse, use get_verse_details and get_tafsir to provide a deeply grounded explanation. \n\nOutput your final response in this exact JSON structure: \n{ \"verse_key\": \"...\", \"guidance\": \"A short, empathetic explanation of why this verse applies\", \"reflection\": \"A daily application prompt for the user\" }";

      let turns = 0;
      while (turns < 5) {
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1024,
          system: systemPrompt,
          messages,
          tools: TOOLS
        });

        if (response.stop_reason === 'tool_use') {
          messages.push({ role: 'assistant', content: response.content });
          
          const toolResults = await Promise.all(response.content.map(async (contentBlock) => {
            if (contentBlock.type !== 'tool_use') return null;
            
            const toolUse = contentBlock as any;
            let result;
            if (toolUse.name === 'search_quran') result = await searchQuran(toolUse.input.query);
            else if (toolUse.name === 'get_verse_details') result = await getVerseDetails(toolUse.input.verse_key);
            else if (toolUse.name === 'get_tafsir') result = await getTafsir(toolUse.input.verse_key);
            
            return {
              type: 'tool_result' as const,
              tool_use_id: toolUse.id,
              content: result
            };
          }));

          messages.push({ role: 'user', content: toolResults.filter(r => r !== null) });
          turns++;
        } else {
          const textBlock = response.content.find(c => c.type === 'text') as any;
          const jsonMatch = textBlock?.text.match(/\{.*\}/s);
          if (jsonMatch) {
            finalJson = JSON.parse(jsonMatch[0]);
          }
          break;
        }
      }

    } else {
      // GPT-4o Implementation
      const openai = new OpenAI({ apiKey: key });
      const messages: any[] = [
        { role: 'system', content: "You are 'The Whisper', a spiritual guide. Use search_quran, get_verse_details, and get_tafsir to provide grounded Quranic guidance. Return JSON: { \"verse_key\": \"...\", \"guidance\": \"...\", \"reflection\": \"...\" }" },
        { role: 'user', content: challenge }
      ];

      let turns = 0;
      while (turns < 5) {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          tools: TOOLS.map(t => ({ 
            type: 'function', 
            function: { name: t.name, description: t.description, parameters: t.input_schema } 
          })) as any,
          response_format: { type: 'json_object' }
        });

        const choice = completion.choices[0];
        if (choice.message.tool_calls) {
          messages.push(choice.message);
          
          for (const toolCall of (choice.message.tool_calls as any[])) {
            const name = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);
            let result;
            
            if (name === 'search_quran') result = await searchQuran(args.query);
            else if (name === 'get_verse_details') result = await getVerseDetails(args.verse_key);
            else if (name === 'get_tafsir') result = await getTafsir(args.verse_key);
            
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
    }

    if (!finalJson || !finalJson.verse_key) {
      throw new Error('Failed to generate guidance JSON');
    }

    // Post-generation: Fetch full metadata for ProcessedVerse
    const metadata = await fetchFullVerseDetails(finalJson.verse_key);
    
    const finalVerse: ProcessedVerse = {
      verse_key: finalJson.verse_key,
      chapter_id: metadata.chapter_id || 0,
      verse_number: metadata.verse_number || 0,
      text_uthmani: metadata.text_uthmani || '',
      translation: metadata.translation || '',
      tafsir_snippet: finalJson.guidance,
      audio_url: metadata.audio_url || '',
      chapter_name_arabic: metadata.chapter_name_arabic || '',
      chapter_name_english: metadata.chapter_name_english || '',
    };

    return { data: finalVerse };

  } catch (error: any) {
    console.error('Whisper generation failed:', error);
    return { error: error.message || 'Failed to generate guidance. Please check your API key.' };
  }
}

