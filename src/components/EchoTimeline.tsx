'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BookOpen, CalendarDays } from 'lucide-react';
import { parseNoteBody, isAyahInActionNote } from '@/lib/utils';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { t } from '@/lib/i18n/uiStrings';

interface Note {
  id: string;
  body: string;
  createdAt?: string;
  created_at?: string;
}

interface EchoTimelineProps {
  notes: Note[];
}

/**
 * EchoTimeline — renders a chronological, poetic timeline of all
 * "Echo" sentences generated from the user's application logs.
 * Each Echo is a one-sentence spiritual memoir entry.
 */
export function EchoTimeline({ notes }: EchoTimelineProps) {
  const [visibleCount, setVisibleCount] = useState(5);
  const activeIsoCode = useLanguageStore((state) => state.activeIsoCode);
  const activeDirection = useLanguageStore((state) => state.config.direction);

  // Parse notes and extract only those that have an echo
  const echoEntries = notes
    .filter((n) => isAyahInActionNote(n))
    .map((note) => {
      const { logText, metadata } = parseNoteBody(note.body);
      return { note, logText, metadata };
    })
    .filter((entry) => entry.metadata?.echo)
    .sort((a, b) => {
      const da = new Date(a.note.createdAt || a.note.created_at || 0).getTime();
      const db = new Date(b.note.createdAt || b.note.created_at || 0).getTime();
      return db - da; // newest first
    });

  if (echoEntries.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto ring-1 ring-primary/10">
          <Sparkles className="w-6 h-6 text-primary/30" />
        </div>
        <div className="space-y-2">
          <p className="font-serif text-xl text-primary/60">The Echoes await your first reflection.</p>
          <p className="font-body text-xs text-on-surface-variant/50 italic max-w-xs mx-auto leading-relaxed">
            Save your first log with an AI model configured — your Echo will appear here as a poetic testament to your journey.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical timeline spine */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/30 via-primary/20 to-transparent" />

      <div className="space-y-8 pl-16">
        {echoEntries.slice(0, visibleCount).map((entry, i) => {
          const date = new Date(entry.note.createdAt || entry.note.created_at || 0);
          const verseKey = (entry.metadata as any)?.verse_key || entry.metadata?.verseKey || '';
          const categories = entry.metadata?.categories || [];
          const echo = entry.metadata!.echo!;

          return (
            <motion.div
              key={entry.note.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i, 4) * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative group"
            >
              {/* Timeline node */}
              <div className="absolute -left-[2.6rem] top-4 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full silk-gradient ring-4 ring-background group-hover:scale-125 transition-transform duration-300" />
              </div>

              {/* Echo card */}
              <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 p-6 editorial-shadow parchment-texture group-hover:border-primary/20 transition-all duration-300 relative overflow-hidden">
                {/* Glow on hover */}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.02] transition-colors duration-500 rounded-2xl pointer-events-none" />

                {/* Decorative sparkle */}
                <div className="absolute top-4 right-5 text-primary/10 group-hover:text-primary/20 transition-colors duration-500">
                  <Sparkles className="w-6 h-6 stroke-[1px]" />
                </div>

                {/* Echo sentence */}
                <blockquote className="font-serif text-base md:text-lg leading-relaxed text-primary italic mb-5 relative z-10 border-l-2 border-primary/20 pl-4">
                  <span dir={activeDirection} lang={activeIsoCode}>
                    &ldquo;{echo}&rdquo;
                  </span>
                </blockquote>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 relative z-10">
                  {verseKey && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-primary/70 border border-primary/10 font-label text-[10px] tracking-widest uppercase font-bold">
                      <BookOpen className="w-3 h-3" />
                      <span dir="ltr">{verseKey}</span>
                    </span>
                  )}

                  {date.getTime() > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-label tracking-widest uppercase text-on-surface-variant/50">
                      <CalendarDays className="w-3 h-3" />
                      <span dir={activeDirection}>
                        {date.toLocaleDateString(activeIsoCode, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </span>
                  )}

                  {categories.slice(0, 3).map((cat) => (
                    <span
                      key={cat}
                      className="px-2.5 py-1 rounded-full bg-tertiary-fixed/50 text-on-surface-variant font-label text-[9px] tracking-widest uppercase border border-outline-variant/10"
                    >
                      {t(`cat${cat}` as any, activeIsoCode)}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}

        {visibleCount < echoEntries.length && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-4"
          >
            <button
              onClick={() => setVisibleCount(v => v + 5)}
              className="w-full py-4 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest hover:bg-surface-container-low text-[10px] font-bold tracking-[0.2em] uppercase text-primary/60 hover:text-primary transition-all border-dashed editorial-shadow duration-300"
            >
              Load 5 More Echoes · {echoEntries.length - visibleCount} remaining
            </button>
          </motion.div>
        )}
      </div>

      {/* Tail fade */}
      <div className="h-8 relative">
        <div className="absolute left-6 top-0 w-px h-full bg-gradient-to-b from-primary/10 to-transparent" />
      </div>
    </div>
  );
}
