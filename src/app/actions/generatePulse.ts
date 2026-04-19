'use server';

import { getServerSession } from '@/lib/session';
import { qfConfig } from '@/lib/qf-config';
import { userApiFetch } from '@/lib/api';
import { parseNoteBody, isAyahInActionNote } from '@/lib/utils';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Reference {
  chapterId: number;
  from: number;
  to: number;
}

interface Tag {
  id: number;
  name: string;
  language: string;
}

interface Post {
  id: string;
  body: string;
  references: Reference[];
  tags: Tag[];
}

export async function generatePulse() {
  const session = await getServerSession();
  if (!session || !session.accessToken) {
    return { error: 'Not authenticated. Please log in.' };
  }

  // ----------------------------------------------------------------------------------
  // DYNAMIC AI SELECTION BASED ON "THE ATELIER" (SETTINGS)
  // ----------------------------------------------------------------------------------
  const model = session.preferredModel || 'claude';
  let key: string | undefined;
  if (model === 'claude') key = session.claudeKey;
  else if (model === 'gpt4o') key = session.openaiKey;
  else if (model === 'gemini') key = session.geminiKey;
  else if (model === 'groq') key = session.groqKey;
  else if (model === 'hf') key = session.hfKey;

  if (!key) {
    return { error: 'API Key not found. Please configure your preferred API in The Atelier Settings.' };
  }

  try {
    // 1. Fetch community trending posts
    const communityUrl = `${qfConfig.apiBaseUrl}/quran-reflect/v1/posts/feed?tab=trending`;
    let trendingRes = await fetch(communityUrl, {
      method: 'GET',
      headers: {
        'x-auth-token': session.accessToken,
        'x-client-id': qfConfig.clientId,
      }
    });
    
    if (!trendingRes.ok && (trendingRes.status === 403 || trendingRes.status === 401)) {
      console.warn(`[Pulse] Auth fetch returned ${trendingRes.status}. Retrying as public fetch...`);
      trendingRes = await fetch(communityUrl, {
        method: 'GET',
        headers: {
          'x-client-id': qfConfig.clientId,
        }
      });
    }

    if (!trendingRes.ok) {
       console.warn('[Pulse] Community feed fetch failed:', trendingRes.status);
    }
    const trendingData = trendingRes.ok ? await trendingRes.json() : { data: [] };
    const posts: Post[] = trendingData.data || trendingData || [];

    // Tally references
    const refCounts: Record<string, { count: number; refs: Reference; postBodies: string[]; tags: string[] }> = {};
    for (const post of posts) {
      if (!post.references) continue;
      for (const ref of post.references) {
         const key = `${ref.chapterId}:${ref.from}`;
         if (!refCounts[key]) {
           refCounts[key] = { count: 0, refs: ref, postBodies: [], tags: [] };
         }
         refCounts[key].count++;
         if (post.body && refCounts[key].postBodies.length < 3) {
           refCounts[key].postBodies.push(post.body);
         }
         if (post.tags) {
           post.tags.forEach(t => {
             if (!refCounts[key].tags.includes(t.name)) refCounts[key].tags.push(t.name);
           });
         }
      }
    }

    const sortedVerses = Object.values(refCounts).sort((a, b) => b.count - a.count).slice(0, 3);
    
    // If no community data, do not provide fake data
    if (sortedVerses.length === 0) {
      return { error: 'The Ummah is currently quiet. No trending community reflections found at this moment.' };
    }

    // 2. UNIFIED PERSONAL CONTEXT: Bookmarks + Notes (Reflections)
    let personalContext: any[] = [];
    try {
       // Fetch native bookmarks
       const bRes: any = await userApiFetch('/bookmarks?mushafId=2&first=20', session.accessToken);
       const bookmarks = bRes.data || [];
       bookmarks.forEach((b: any) => {
         personalContext.push({
           verse_key: b.verseKey || `${b.chapterId}:${b.verseNumber}`,
           type: 'bookmark',
           date: b.createdAt
         });
       });

       // Fetch recent reflections (notes)
       const nRes: any = await userApiFetch('/notes?limit=20', session.accessToken);
       const notes = nRes.data || [];
       notes.forEach((n: any) => {
         if (isAyahInActionNote(n)) {
           const { metadata } = parseNoteBody(n.body);
           const vKey = metadata?.verseKey;
           if (vKey) {
              personalContext.push({
                verse_key: vKey,
                type: 'reflection',
                date: n.createdAt
              });
           }
         }
       });
    } catch(err) {
       console.warn("[Pulse] Personal context fetch partially failed:", err);
    }

    const promptData = {
      trending_verses: sortedVerses.map(v => ({
         verse_key: `${v.refs.chapterId}:${v.refs.from}`,
         community_reflections: v.postBodies,
         themes: v.tags
      })),
      user_personal_context: personalContext
    };

    const { getLanguageInstruction } = await import('@/lib/ai/languageInstruction');
    
    const SYSTEM_PROMPT = `${getLanguageInstruction(session.isoCode || 'en', session.direction || 'ltr')}You are 'The Ummah Pulse'. Your goal is to analyze current community trends and connect them to the user's personal context (bookmarks and private reflections) in a simple, clear, and detailed way.
     
    Core Objectives:
    1. Identify common themes in the provided community_reflections.
    2. Check the user_personal_context for any direct or thematic matches in their bookmarks or reflections.
    3. Generate a 'personalized_message' that explains why a specific verse was chosen for them today based on these two data points.
    
    Message Guidelines:
    - Be direct and informative.
    - Explicitly state the connection: "X verses are trending in the community regarding [Topic]. Since you recently [reflected on/bookmarked] verses about [Topic/Verse ID], this connection was found."
    - Provide a detailed explanation of why the community is sitting with these verses and how it relates to the user's saved items.
    - DO NOT say the user has no bookmarks if they have reflections (and vice versa). Treat 'user_personal_context' as their total history.
    - Do not use poetic or flowery language. 
    
    CRITICAL: YOU MUST strictly output ONLY valid JSON without Markdown blocks. 
    Format:
    {
       "personalized_message": "A clear and detailed explanation of the connection...",
       "personal_verse": "chapter:verse",
       "trending": [
          { "verse_key": "93:3", "reflection_snippet": "...", "theme": "Sabr" },
          { "verse_key": "94:5", "reflection_snippet": "...", "theme": "Tawakkul" }
       ]
    }`;

    let finalJson: any = null;
    const challenge = JSON.stringify(promptData);

    try {
      if (model === 'claude') {
        const anthropic = new Anthropic({ apiKey: key });
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: challenge }]
        });
        const textBlock = response.content.find(c => c.type === 'text') as any;
        const jsonMatch = textBlock?.text.match(/\{.*\}/s);
        finalJson = JSON.parse(jsonMatch ? jsonMatch[0] : textBlock?.text || '{}');
      } else if (model === 'gpt4o' || model === 'groq' || model === 'hf') {
        const isGroq = model === 'groq';
        const isHf = model === 'hf';
        const baseURL = isGroq ? 'https://api.groq.com/openai/v1' : isHf ? 'https://api-inference.huggingface.co/v1/' : undefined;
        let aiModel = 'gpt-4o';
        if (isGroq) aiModel = 'llama-3.3-70b-versatile';
        if (isHf) aiModel = 'meta-llama/Meta-Llama-3-70B-Instruct';

        const openai = new OpenAI({ apiKey: key, baseURL });
        const completion = await openai.chat.completions.create({
          model: aiModel,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: challenge }
          ],
          response_format: { type: 'json_object' }
        });
        finalJson = JSON.parse(completion.choices[0].message.content || '{}');
      } else if (model === 'gemini') {
        const genAI = new GoogleGenerativeAI(key);
        const geminiModel = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          systemInstruction: SYSTEM_PROMPT,
        });
        const result = await geminiModel.generateContent(challenge);
        const text = result.response.text();
        const jsonMatch = text.match(/\{.*\}/s);
        finalJson = JSON.parse(jsonMatch ? jsonMatch[0] : text || '{}');
      }
    } catch(e) {
      console.error("AI Generation Error", e);
      finalJson = null;
    }

    if (!finalJson) {
      return { error: 'Failed to generate personalized Ummah Pulse guidance. Our AI scribes might be busy. Please try again soon.' };
    }

    // Now enrich the verses with metadata from public API
    const fetchMetadata = async (verseKey: string) => {
       try {
        const tId = session.translationResourceId || 131;
        const isoCode = session.isoCode || 'en';
         const [chapterId] = verseKey.split(':');
         const chapRes = await fetch(`https://api.quran.com/api/v4/chapters/${chapterId}?language=${isoCode}`);
         const verseRes = await fetch(`https://api.quran.com/api/v4/verses/by_key/${verseKey}?translations=${tId},20&audio=1&fields=text_uthmani`);
         const chapData = await chapRes.json();
         const verseData = await verseRes.json();
         const v = verseData.verse;
         return {
           verse_key: verseKey,
           chapter_name_english: chapData.chapter?.name_simple,
           text_uthmani: v.text_uthmani,
           translation: v.translations?.[0]?.text?.replace(/<[^>]*>?/gm, '')
         };
       } catch(err) { 
         console.warn(`[Pulse] Metadata fetch failed for ${verseKey}:`, err);
         return { verse_key: verseKey }; 
       }
    };

    const finalResult = {
      personalized_message: finalJson.personalized_message,
      personal_verse: await fetchMetadata(finalJson.personal_verse),
      trending: await Promise.all(finalJson.trending.map(async (t: any) => ({
         ...t,
         meta: await fetchMetadata(t.verse_key)
      })))
    };

    return { data: finalResult };

  } catch (err: any) {
    console.error("Ummah Pulse generation root error:", err);
    return { error: err.message || "Failed to fetch Ummah Pulse" };
  }
}
