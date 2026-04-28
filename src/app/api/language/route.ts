import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTypedSession } from '@/lib/session';
import { LANGUAGE_CONFIGS } from '@/config/languageConfig';

export async function POST(req: NextRequest) {
  try {
    const { isoCode } = await req.json();
    const config = LANGUAGE_CONFIGS[isoCode as keyof typeof LANGUAGE_CONFIGS];

    if (!config) {
      return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const session = await getTypedSession(cookieStore);

    // Hydrate the session
    session.isoCode = isoCode;
    session.direction = config.direction;
    session.translationResourceId = config.quranTranslationId ?? undefined;
    session.tafsirResourceId = config.tafsirResourceId;
    session.nativeName = config.nativeName;

    await session.save();

    // Sync to QF Backing Preferences API
    if (session.accessToken) {
      const { setPreference } = await import('@/lib/api');
      
      // Always store the translation resource ID (integer values are supported unboundedly)
      await setPreference(session.accessToken, 'translations', 'selectedTranslations', [session.translationResourceId]);
      
      // Limit ISO language uploads to the QF supported enums to avoid 422 crash
      if (config.qfPreferenceSupported) {
        await setPreference(session.accessToken, 'language', 'language', isoCode);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API Language Route] Error:', err);
    return NextResponse.json({ error: 'Failed to update language session' }, { status: 500 });
  }
}
