'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Play, Pause, Quote } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import type { ProcessedVerse } from '@/types/quran';
import { useAyahStore } from '@/stores/useAyahStore';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { t } from '@/lib/i18n/uiStrings';
import { formatNumber } from '@/config/languageConfig';

interface AyahCardProps {
  ayah: ProcessedVerse;
}

export function AyahCard({ ayah }: AyahCardProps) {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const { currentAyah, setCurrentAyah } = useAyahStore();
  const activeIsoCode = useLanguageStore((state) => state.activeIsoCode);
  const activeDirection = useLanguageStore((state) => state.config.direction);
  
  // Use store version if it exists, otherwise use prop
  const displayAyah = currentAyah || ayah;

  useEffect(() => {
    // If store is empty, initialize it with the server-fetched ayah
    if (!currentAyah && ayah) {
       setCurrentAyah(ayah);
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
            <span className="font-serif italic text-primary text-xl">
              {formatNumber(displayAyah.chapter_id || 0, activeIsoCode)}
            </span>
          </div>
          <div>
            <h3 className="font-serif text-lg text-primary leading-none mb-1">
              {displayAyah.chapter_name_english}
            </h3>
            <span className="font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant">
              {t('verse', activeIsoCode)} {formatNumber(displayAyah.verse_number || 0, activeIsoCode)}
            </span>
          </div>
        </div>
        
        <Badge className={cn(
          "font-label text-[10px] tracking-widest px-4 py-1.5 border-none transition-all duration-500",
          currentAyah && ayah && currentAyah.verse_key !== ayah.verse_key ? "silk-gradient text-white shadow-lg scale-105" : "bg-tertiary-fixed text-on-tertiary-fixed"
        )}>
           {currentAyah && ayah && currentAyah.verse_key !== ayah.verse_key ? t('navWhisper', activeIsoCode).toUpperCase() : t('todaysSanctuary', activeIsoCode).toUpperCase()}
        </Badge>
      </div>

      <div className="relative mb-8">
        <span className="absolute -top-6 -left-4 text-primary/5 select-none pointer-events-none">
          <Quote className="w-16 h-16 fill-current" />
        </span>
        <p className="text-center mb-4">
          <span className="quran-text text-primary" dir="rtl" lang="ar">
            {displayAyah.text_uthmani}
          </span>
        </p>
      </div>

      <div className="max-w-2xl mx-auto text-center mb-6">
        <p className="font-body text-sm md:text-base text-on-surface leading-relaxed italic">
          <span dir={activeDirection} lang={activeIsoCode}>
            &ldquo;{displayAyah.translation}&rdquo;
          </span>
        </p>
      </div>

      {displayAyah.tafsir_snippet && (
        <div className="max-w-3xl mx-auto bg-surface-container-lowest/40 backdrop-blur-sm rounded-xl p-4 border border-outline-variant/10 mb-8">
          <div className="flex gap-3 items-start">
            <div className="mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            </div>
            <p className="font-body text-xs text-on-surface-variant leading-relaxed italic">
              <span dir={activeDirection} lang={activeIsoCode}>
                {displayAyah.tafsir_snippet}
              </span>
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
              {isPlaying ? '...' : t('listen', activeIsoCode)} 
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
            {copied ? t('copied', activeIsoCode) : t('preserveInsight', activeIsoCode)}
          </span>
        </button>
      </div>
    </motion.div>
  );
}
