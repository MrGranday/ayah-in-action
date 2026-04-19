'use server';

import { getServerSession } from '@/lib/session';
import { qfConfig } from '@/lib/qf-config';
import { userApiFetch } from '@/lib/api';
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
  // The system uses whatever AI the user clicked/selected in The Atelier settings.
  // This screen and logic are specifically bound to that chosen API. 
  // It applies the chosen AI across the entire project unconditionally.
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
    let trendingRes = await fetch(`${qfConfig.apiBaseUrl}/quran-reflect/v1/posts/feed?tab=trending`, {
      method: 'GET',
      headers: {
        'x-auth-token': session.accessToken,
        'x-client-id': qfConfig.clientId,
      }
    });
    
    // If authenticated fetch fails (e.g. 403, 401), retry as a Public fetch.
    // Trending community data is often public, and a restricted token can block results.
    if (!trendingRes.ok && (trendingRes.status === 403 || trendingRes.status === 401)) {
      console.warn(`[Pulse] Auth fetch returned ${trendingRes.status}. Retrying as public fetch...`);
      trendingRes = await fetch(`${qfConfig.apiBaseUrl}/quran-reflect/v1/posts/feed?tab=trending`, {
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

    // 2. Fetch User Bookmarks (and Notes if needed, keeping simple with Bookmarks first)
    let bookmarks: any[] = [];
    try {
       // QF API now requires 'first' for pagination. Without it, we get a 422.
       // This re-enables the data link so the AI can see the user's history.
       const bRes: any = await userApiFetch('/bookmarks?mushafId=2&first=20', session.accessToken);
       bookmarks = bRes.data || bRes || [];
    } catch(err) {
       console.warn("Failed to fetch bookmarks:", err);
    }

    const promptData = {
      trending_verses: sortedVerses.map(v => ({
         verse_key: `${v.refs.chapterId}:${v.refs.from}`,
         community_reflections: v.postBodies,
         themes: v.tags
      })),
      user_bookmarks: bookmarks.map((b: any) => ({
         verse_key: b.verseKey || `${b.chapterId}:${b.verseNumber}`,
         createdAt: b.createdAt
      }))
    };

    const { getLanguageInstruction } = await import('@/lib/ai/languageInstruction');
    
    const SYSTEM_PROMPT = `${getLanguageInstruction(session.isoCode || 'en', session.direction || 'ltr')}You are 'The Ummah Pulse', a profound spiritual mirror bridging the collective consciousness of the global Muslim community and the private heart-work of the user. Your voice should be poetic, insightful, and deeply compassionate—matching a premium 'Living Journal' aesthetic.
     
    Core Objectives:
    1. Analyze the themes currently trending in the Ummah (look at community_reflections and themes).
    2. Cross-reference these with the user's bookmark history.
    3. Generate a 'personalized_message' that feels like a shared secret between the Divine, the community, and the user.
    
    Message Guidelines:
    - Use narrative, reflective language (e.g., "While thousands are currently leaning into the shelter of Al-Kahf, it is no coincidence that you sought refuge in this same verse weeks ago...")
    - If there is a direct overlap between a community-trending verse and a user bookmark, celebrate that shared heartbeat.
    - If there is no direct overlap, find a thematic bridge based on the 'themes' provided (e.g., "The community is sitting with themes of hardship today, much like the verses you have been holding in your bookmarks.")
    - Avoid generic advice. Be specific about the verses provided.
    
    CRITICAL: YOU MUST strictly output ONLY valid JSON without Markdown blocks. 
    Format:
    {
       "personalized_message": "A 2-3 sentence narrative of profound connection...",
       "personal_verse": "chapter:verse",
       "trending": [
          { "verse_key": "93:3", "reflection_snippet": "A soul remembered... 'This verse finds me every time...'", "theme": "Sabr" },
          { "verse_key": "94:5", "reflection_snippet": "A soul remembered... 'Not after, but with...'", "theme": "Tawakkul" }
       ]
    }`;

    let finalJson: any = null;
    const challenge = JSON.stringify(promptData);

    try {
      // ------------------------------------------------------------------------------
      // ROUTE TO THE USER'S CHOSEN AI PROVIDER
      // The system strictly limits this call to whichever API the user configured.
      // ------------------------------------------------------------------------------
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
        // Fallback for OpenAI-compatible interfaces as configured in The Atelier
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
