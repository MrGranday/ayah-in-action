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
        
        // DOM Sync
        document.documentElement.setAttribute('lang', config.htmlLang);
        document.documentElement.setAttribute('dir', config.direction);
        document.documentElement.style.setProperty('--app-font', config.fontFamily);
        
        // Zustand state update
        set({ activeIsoCode: isoCode, config });

        // Sync to Server Session Cookie for SSR components
        try {
          await fetch('/api/language', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              isoCode: config.isoCode,
              direction: config.direction,
              translationResourceId: config.quranTranslationId,
              nativeName: config.nativeName
            }),
          });
        } catch (error) {
          console.error('[LanguageStore] Failed to sync session cookie:', error);
        }
      },
    }),
    {
      name: 'aya-language-store',
    }
  )
);
