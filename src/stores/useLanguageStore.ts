'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LANGUAGE_CONFIGS, getLanguageConfig, LanguageConfig } from '@/config/languageConfig';

interface LanguageState {
  activeIsoCode: string;
  config: LanguageConfig;
  setLanguage: (isoCode: string) => Promise<void>;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      activeIsoCode: 'en',
      config: LANGUAGE_CONFIGS['en'],

      setLanguage: async (isoCode: string) => {
        const config = getLanguageConfig(isoCode);

        // Optimistic DOM sync — applies instantly before the reload
        // so the user sees no flash of wrong direction/font
        document.documentElement.setAttribute('lang', config.htmlLang);
        document.documentElement.setAttribute('dir', config.direction);
        document.documentElement.style.setProperty('--app-font', config.fontFamily);

        // Persist to Zustand (survives the reload via localStorage)
        set({ activeIsoCode: isoCode, config });

        // Sync to Server Session Cookie — SSR components read this
        try {
          await fetch('/api/language', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              isoCode: config.isoCode,
              direction: config.direction,
              translationResourceId: config.quranTranslationId,
              nativeName: config.nativeName,
            }),
          });
        } catch (error) {
          console.error('[LanguageStore] Failed to sync session cookie:', error);
          // Still reload — Zustand persisted state ensures correct language
          // even if the cookie sync failed
        }

        // Full page reload so every part of the app re-initializes:
        // - SSR layout.tsx re-reads session.isoCode → correct lang/dir on <html>
        // - Server Actions re-read session.isoCode → correct AI language lock
        // - All Server Components re-render in the new language
        // - Fonts and RTL CSS re-apply from the new <html lang="...">
        // - Stale AI responses from previous language are cleared
        window.location.reload();
      },
    }),
    {
      name: 'aya-language-store',
    }
  )
);
