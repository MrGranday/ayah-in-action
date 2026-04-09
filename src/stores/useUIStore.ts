'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BeforeInstallPromptEvent } from '@/types/pwa';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  installPromptEvent: BeforeInstallPromptEvent | null;
  setTheme: (theme: UIState['theme']) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setInstallPromptEvent: (event: BeforeInstallPromptEvent | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: true,
      installPromptEvent: null,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setInstallPromptEvent: (installPromptEvent) => set({ installPromptEvent }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
