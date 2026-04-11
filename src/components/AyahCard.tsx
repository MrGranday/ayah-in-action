'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Play, Pause, Quote } from 'lucide-react';
import { Badge } from './ui/badge';
import type { ProcessedVerse } from '@/types/quran';

interface AyahCardProps {
  ayah: ProcessedVerse;
}

export function AyahCard({ ayah }: AyahCardProps) {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (ayah.audio_url) {
      const audioEl = new Audio(ayah.audio_url);
      audioEl.onended = () => setIsPlaying(false);
      setAudio(audioEl);
    }
    return () => {
      audio?.pause();
    };
  }, [ayah.audio_url]);

  const handleCopy = async () => {
    const text = `${ayah.text_uthmani}\n\n${ayah.translation}`;
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
      className="relative overflow-hidden bg-surface-container-low rounded-[2rem] border border-outline-variant/10 editorial-shadow p-8 md:p-12 parchment-texture"
    >
      {/* Decorative Corner */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary-fixed opacity-5 blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
            <span className="font-serif italic text-primary text-xl">{ayah.chapter_id}</span>
          </div>
          <div>
            <h3 className="font-serif text-xl text-primary leading-none mb-1">
              {ayah.chapter_name_english}
            </h3>
            <span className="font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant">
              Verse {ayah.verse_number}
            </span>
          </div>
        </div>
        
        <Badge className="bg-tertiary-fixed text-on-tertiary-fixed font-label text-[10px] tracking-widest px-4 py-1.5 border-none">
           DAILY GUIDANCE
        </Badge>
      </div>

      <div className="relative mb-12">
        <span className="absolute -top-6 -left-4 text-primary/5 select-none pointer-events-none">
          <Quote className="w-16 h-16 fill-current" />
        </span>
        <p
          className="font-serif text-4xl md:text-6xl text-primary leading-[1.4] md:leading-[1.6] text-center mb-10"
          dir="rtl"
        >
          {ayah.text_uthmani}
        </p>
      </div>

      <div className="max-w-2xl mx-auto text-center mb-12">
        <p className="font-body text-lg md:text-xl text-on-surface leading-relaxed italic">
          &ldquo;{ayah.translation}&rdquo;
        </p>
      </div>

      {ayah.tafsir_snippet && (
        <div className="max-w-3xl mx-auto bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-outline-variant/5 mb-12">
          <div className="flex gap-4 items-start">
            <div className="mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            </div>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed italic">
              {ayah.tafsir_snippet}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-8 border-t border-outline-variant/5 pt-10">
        {audio && (
          <button
            onClick={toggleAudio}
            className="flex items-center gap-3 group transition-all"
          >
            <div className="w-12 h-12 rounded-full silk-gradient flex items-center justify-center text-white editorial-shadow group-hover:scale-110 transition-transform">
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-1" />
              )}
            </div>
            <span className="font-label text-xs tracking-[0.2em] uppercase text-primary font-bold">
              {isPlaying ? 'Listening...' : 'Listen'}
            </span>
          </button>
        )}

        <button
          onClick={handleCopy}
          className="flex items-center gap-3 group transition-all"
        >
          <div className="w-12 h-12 rounded-full border border-outline-variant/20 flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
            {copied ? (
              <Check className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </div>
          <span className="font-label text-xs tracking-[0.2em] uppercase text-on-surface-variant font-bold group-hover:text-primary transition-colors">
            {copied ? 'Copied' : 'Preserve'}
          </span>
        </button>
      </div>
    </motion.div>
  );
}
