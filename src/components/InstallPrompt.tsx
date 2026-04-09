'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { Button } from './ui/button';
import type { BeforeInstallPromptEvent } from '@/types/pwa';

export function InstallPrompt() {
  const { installPromptEvent, setInstallPromptEvent } = useUIStore();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [setInstallPromptEvent]);

  useEffect(() => {
    const dismissedTime = localStorage.getItem('install-prompt-dismissed');
    if (dismissedTime) {
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedTime) < thirtyDays) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    if (!installPromptEvent) return;
    const { prompt } = installPromptEvent;
    await prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      setInstallPromptEvent(null);
    }
  };

  if (!installPromptEvent || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-surface border border-border rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">Add Ayah in Action to your home screen</p>
          <p className="text-xs text-text-muted">For quick access and offline use</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleInstall}>
            Install
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
