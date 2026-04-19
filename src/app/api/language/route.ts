import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTypedSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { isoCode, direction, translationResourceId, nativeName } = body;

    // Validate payloads
    if (!isoCode || !direction || !translationResourceId || !nativeName) {
      return NextResponse.json({ error: 'Missing language data' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const session = await getTypedSession(cookieStore);

    // Hydrate the session
    session.isoCode = isoCode;
    session.direction = direction;
    session.translationResourceId = translationResourceId;
    session.nativeName = nativeName;

    await session.save();

    // Sync to QF Backing Preferences API
    if (session.accessToken) {
      const { setPreference } = await import('@/lib/api');
      const { LANGUAGE_CONFIG } = await import('@/lib/config/languageMap');
      
      // Always store the translation resource ID (integer values are supported unboundedly)
      await setPreference(session.accessToken, 'translations', 'selectedTranslations', [translationResourceId]);
      
      // Limit ISO language uploads to the QF supported enums to avoid 422 crash
      if (LANGUAGE_CONFIG[isoCode]?.qfPreferenceSupported) {
        await setPreference(session.accessToken, 'language', 'language', isoCode);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API Language Route] Error:', err);
    return NextResponse.json({ error: 'Failed to update language session' }, { status: 500 });
  }
}
