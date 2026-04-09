'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProcessedVerse } from '@/types/quran';
import type { Category } from '@/types/log';

interface AyahState {
  currentAyah: ProcessedVerse | null;
  hasLoggedToday: boolean;
  todayLogText: string;
  todayLogId: string | null;
  selectedCategories: Category[];
  voiceNoteBlob: Blob | null;
  voiceTranscript: string;
  setCurrentAyah: (ayah: ProcessedVerse) => void;
  setHasLoggedToday: (logged: boolean, logId?: string, logText?: string) => void;
  setSelectedCategories: (cats: Category[]) => void;
  setVoiceNote: (blob: Blob, transcript: string) => void;
  clearLogForm: () => void;
}

export const useAyahStore = create<AyahState>()(
  persist(
    (set) => ({
      currentAyah: null,
      hasLoggedToday: false,
      todayLogText: '',
      todayLogId: null,
      selectedCategories: [],
      voiceNoteBlob: null,
      voiceTranscript: '',
      setCurrentAyah: (ayah) => set({ currentAyah: ayah }),
      setHasLoggedToday: (logged, logId, logText) =>
        set({
          hasLoggedToday: logged,
          todayLogId: logId || null,
          todayLogText: logText || '',
        }),
      setSelectedCategories: (selectedCategories) => set({ selectedCategories }),
      setVoiceNote: (blob, transcript) =>
        set({ voiceNoteBlob: blob, voiceTranscript: transcript }),
      clearLogForm: () =>
        set({
          selectedCategories: [],
          voiceNoteBlob: null,
          voiceTranscript: '',
        }),
    }),
    {
      name: 'ayah-store',
      partialize: (state) => ({
        currentAyah: state.currentAyah,
      }),
    }
  )
);
