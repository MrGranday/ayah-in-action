'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      initial={{ opacity: 0, scale: 0.97, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="parchment p-6 md:p-8"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-text-muted">
          {ayah.chapter_name_english}
        </span>
        <Badge variant="gold">
          {ayah.chapter_id}:{ayah.verse_number}
        </Badge>
      </div>

      <p
        className="font-amiri text-2xl md:text-4xl text-center leading-loose mb-6"
        dir="rtl"
      >
        {ayah.text_uthmani}
      </p>

      <p className="font-inter text-base text-text-muted text-center mb-4">
        {ayah.translation}
      </p>

      <div className="border-l-2 border-emerald pl-4 italic text-sm text-text-muted mb-6">
        {ayah.tafsir_snippet}
      </div>

      <div className="flex items-center justify-between">
        {audio ? (
          <button
            onClick={toggleAudio}
            className="flex items-center gap-2 text-emerald hover:text-emerald/80 transition-colors"
          >
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald/10">
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </span>
            <span className="text-sm font-medium">
              {isPlaying ? 'Pause' : 'Play Audio'}
            </span>
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 text-text-muted hover:text-emerald transition-colors"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          <span className="text-sm">{copied ? 'Copied!' : 'Copy Ayah'}</span>
        </button>
      </div>
    </motion.div>
  );
}
