'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LanguageOption {
  isoCode: string;
  direction: 'ltr' | 'rtl';
  translationResourceId: number;
  nativeName: string;
}

interface LanguageState extends LanguageOption {
  setLanguage: (lang: LanguageOption) => Promise<void>;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      isoCode: 'en',
      direction: 'ltr',
      translationResourceId: 131, // Clear Quran English default
      nativeName: 'English',

      setLanguage: async (lang) => {
        // 1. Update Zustand store instantly for client reactivity
        set({
          isoCode: lang.isoCode,
          direction: lang.direction,
          translationResourceId: lang.translationResourceId,
          nativeName: lang.nativeName,
        });

        // 2. Sync to Server Session Cookie for SSR components
        try {
          await fetch('/api/language', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lang),
          });
        } catch (error) {
          console.error('[LanguageStore] Failed to sync session cookie:', error);
        }
      },
    }),
    {
      name: 'language-store',
    }
  )
);
