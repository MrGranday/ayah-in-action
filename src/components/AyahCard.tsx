'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Play, Pause, Quote } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import type { ProcessedVerse } from '@/types/quran';
import { useAyahStore } from '@/stores/useAyahStore';

interface AyahCardProps {
  ayah: ProcessedVerse;
}

export function AyahCard({ ayah }: AyahCardProps) {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const { currentAyah, setCurrentAyah } = useAyahStore();
  
  // Use store version if it exists, otherwise use prop
  const displayAyah = currentAyah || ayah;

  useEffect(() => {
    // If store is empty, initialize it with the server-fetched ayah
    if (!currentAyah && ayah) {
       setCurrentAyah(ayah);
    }
    // If the server ayah changes (e.g. via shuffle) and we AREN'T showing a whisper,
    // we should sync the store so that the 'displayAyah' logic (line 23) picks it up.
    if (currentAyah && ayah && currentAyah.verse_key !== ayah.verse_key) {
        // Only override if the current store version looks like a previous daily guidiance
        // OR if the user specifically requested a shuffle (handled by clearing currentAyah above).
        // For reliability, we stick to the 'clear store' pattern in ShuffleAyahButton.
    }
  }, [ayah, currentAyah, setCurrentAyah]);

  useEffect(() => {
    if (displayAyah.audio_url) {
      const audioEl = new Audio(displayAyah.audio_url);
      audioEl.onended = () => setIsPlaying(false);
      setAudio(audioEl);
    }
    return () => {
      audio?.pause();
    };
  }, [displayAyah.audio_url]);

  const handleCopy = async () => {
    const text = `${displayAyah.text_uthmani}\n\n${displayAyah.translation}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleAudio = () => {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden bg-surface-container-low rounded-2xl border border-outline-variant/10 editorial-shadow p-5 md:p-6 parchment-texture"
    >
      {/* Decorative Corner */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary-fixed opacity-5 blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
            <span className="font-serif italic text-primary text-xl">{displayAyah.chapter_id}</span>
          </div>
          <div>
            <h3 className="font-serif text-lg text-primary leading-none mb-1">
              {displayAyah.chapter_name_english}
            </h3>
            <span className="font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant">
              Verse {displayAyah.verse_number}
            </span>
          </div>
        </div>
        
        <Badge className={cn(
          "font-label text-[10px] tracking-widest px-4 py-1.5 border-none transition-all duration-500",
          currentAyah && ayah && currentAyah.verse_key !== ayah.verse_key ? "silk-gradient text-white shadow-lg scale-105" : "bg-tertiary-fixed text-on-tertiary-fixed"
        )}>
           {currentAyah && ayah && currentAyah.verse_key !== ayah.verse_key ? 'WHISPER GUIDANCE' : 'DAILY GUIDANCE'}
        </Badge>
      </div>

      <div className="relative mb-8">
        <span className="absolute -top-6 -left-4 text-primary/5 select-none pointer-events-none">
          <Quote className="w-16 h-16 fill-current" />
        </span>
        <p
          className="font-serif text-2xl md:text-3xl text-primary leading-[1.4] md:leading-[1.6] text-center mb-4"
          dir="rtl"
        >
          {displayAyah.text_uthmani}
        </p>
      </div>

      <div className="max-w-2xl mx-auto text-center mb-6">
        <p className="font-body text-sm md:text-base text-on-surface leading-relaxed italic">
          &ldquo;{displayAyah.translation}&rdquo;
        </p>
      </div>

      {displayAyah.tafsir_snippet && (
        <div className="max-w-3xl mx-auto bg-surface-container-lowest/40 backdrop-blur-sm rounded-xl p-4 border border-outline-variant/10 mb-8">
          <div className="flex gap-3 items-start">
            <div className="mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            </div>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed italic">
              {displayAyah.tafsir_snippet}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-6 border-t border-outline-variant/10 pt-8">
        {audio && (
          <button
            onClick={toggleAudio}
            className="flex items-center gap-2 group transition-all"
          >
            <div className="w-10 h-10 rounded-full silk-gradient flex items-center justify-center text-white editorial-shadow group-hover:scale-110 transition-transform">
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-1" />
              )}
            </div>
            <span className="font-label text-[10px] tracking-[0.2em] uppercase text-primary font-bold">
              {isPlaying ? 'Listening...' : 'Listen'}
            </span>
          </button>
        )}

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 group transition-all"
        >
          <div className="w-10 h-10 rounded-full border border-outline-variant/20 flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </div>
          <span className="font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant font-bold group-hover:text-primary transition-colors">
            {copied ? 'Copied' : 'Preserve'}
          </span>
        </button>
      </div>
    </motion.div>
  );
}
