'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { X, Download, Share } from 'lucide-react';
import type { BeforeInstallPromptEvent } from '@/types/pwa';

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return (window.navigator as any).standalone === true
    || window.matchMedia('(display-mode: standalone)').matches;
}

const DISMISS_KEY = 'install-prompt-dismissed';
const DISMISS_DAYS = 7;

export function InstallPrompt() {
  const { installPromptEvent, setInstallPromptEvent } = useUIStore();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check dismiss status and capture any pre-mount event
  useEffect(() => {
    setMounted(true);

    // Skip if already installed as PWA
    if (isInStandaloneMode()) return;

    // Check dismiss window (7 days)
    const dismissedTime = localStorage.getItem(DISMISS_KEY);
    if (dismissedTime) {
      const elapsed = Date.now() - parseInt(dismissedTime);
      if (elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
      // Dismiss expired — clear it and re-show
      localStorage.removeItem(DISMISS_KEY);
    }

    setDismissed(false);

    // Pick up any event already captured by the inline <script> in layout.tsx
    if ((window as any)._pwaInstallEvent && !installPromptEvent) {
      setInstallPromptEvent((window as any)._pwaInstallEvent as BeforeInstallPromptEvent);
    }

    // iOS: show the manual guide instead
    if (isIOS()) {
      setShowIOSGuide(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for the event fired by the inline script (if React mounted in time)
  useEffect(() => {
    const onReady = (e: Event) => {
      if ((window as any)._pwaInstallEvent) {
        setInstallPromptEvent((window as any)._pwaInstallEvent as BeforeInstallPromptEvent);
        setDismissed(false);
      }
    };
    const onInstalled = () => setInstallPromptEvent(null);

    window.addEventListener('pwa-install-ready', onReady);
    window.addEventListener('pwa-installed', onInstalled);
    return () => {
      window.removeEventListener('pwa-install-ready', onReady);
      window.removeEventListener('pwa-installed', onInstalled);
    };
  }, [setInstallPromptEvent]);

  // Also re-register the beforeinstallprompt listener as a backup
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
      setDismissed(false);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [setInstallPromptEvent]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      setInstallPromptEvent(null);
      setDismissed(true);
    }
  }, [installPromptEvent, setInstallPromptEvent]);

  // Don't render until mounted (avoids SSR mismatch)
  if (!mounted || dismissed) return null;

  // iOS: Show manual install guide
  if (showIOSGuide && !installPromptEvent) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[22rem] z-50 animate-in slide-in-from-bottom-4 duration-500">
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl shadow-2xl editorial-shadow overflow-hidden">
          {/* Header */}
          <div className="silk-gradient px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/icons/icon-192.png" alt="Ayah in Action" className="w-8 h-8 rounded-xl" />
              <div>
                <p className="font-serif text-sm text-white">Add to Home Screen</p>
                <p className="font-label text-[9px] tracking-widest text-white/60 uppercase">Ayah in Action</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-all">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* iOS instructions */}
          <div className="px-5 py-4 space-y-3">
            <p className="font-body text-xs text-on-surface-variant leading-relaxed">
              Install this app on your iPhone for offline access and a native experience:
            </p>
            <ol className="space-y-2.5">
              {[
                { icon: <Share className="w-3.5 h-3.5" />, text: 'Tap the Share button in Safari' },
                { icon: <Download className="w-3.5 h-3.5" />, text: 'Scroll down and tap "Add to Home Screen"' },
                { icon: <span className="text-[10px] font-bold">✓</span>, text: 'Tap "Add" in the top-right corner' },
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {step.icon}
                  </span>
                  <span className="text-[11px] font-body text-on-surface">{step.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Android/Desktop: native install prompt
  if (!installPromptEvent) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[22rem] z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl shadow-2xl editorial-shadow overflow-hidden">
        {/* Header Banner */}
        <div className="silk-gradient px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-192.png" alt="Ayah in Action" className="w-8 h-8 rounded-xl" />
            <div>
              <p className="font-serif text-sm text-white">Add to Your Device</p>
              <p className="font-label text-[9px] tracking-widest text-white/60 uppercase">Ayah in Action · PWA</p>
            </div>
          </div>
          <button onClick={handleDismiss} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="font-body text-xs text-on-surface-variant italic leading-relaxed mb-4">
            Install for instant access, offline reading, and a full native experience — no App Store required.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleInstall}
              className="flex-1 h-10 rounded-xl silk-gradient text-white font-label text-[10px] tracking-widest uppercase font-bold editorial-shadow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="h-10 px-4 rounded-xl border border-outline-variant/20 text-on-surface-variant font-label text-[10px] tracking-widest uppercase hover:bg-surface-container transition-all"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
