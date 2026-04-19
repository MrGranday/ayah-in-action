'use client';

import React, { useState } from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { VoiceRecorder } from './VoiceRecorder';
import { CATEGORIES, type Category } from '@/types/log';
import { saveApplicationLog } from '@/app/actions/log';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { Sparkles, Edit3, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAyahStore } from '@/stores/useAyahStore';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { t } from '@/lib/i18n/uiStrings';

interface LogFormProps {
  hasLoggedToday: boolean;
  verseKey: string;
  existingLogText?: string;
  existingCategories?: Category[];
  onSaveSuccess?: (logId: string) => void;
}

export function LogForm({
  hasLoggedToday,
  verseKey,
  existingLogText = '',
  existingCategories = [],
  onSaveSuccess,
}: LogFormProps) {
  const { currentAyah, setHasLoggedToday } = useAyahStore();
  const isoCode = useLanguageStore((state) => state.isoCode);
  const effectiveVerseKey = currentAyah?.verse_key || verseKey;

  const [logText, setLogText] = useState(existingLogText);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(existingCategories);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Sync with store if a new Ayah is applied via Whisper
  React.useEffect(() => {
    if (currentAyah && currentAyah.verse_key !== verseKey) {
      // If we switch to a whisper ayah, we might want to reset the form or just update the key
      // For now, just ensuring the key is correct for the save action
    }
  }, [currentAyah, verseKey]);

  const isValid = logText.trim().length > 0 && selectedCategories.length > 0;
  const charCount = logText.length;
  const maxChars = 500;

  const toggleCategory = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSave = async () => {
    if (!isValid) return;

    setIsSaving(true);
    try {
      const result = await saveApplicationLog({
        verseKey: effectiveVerseKey,
        logText: logText.trim(),
        categories: selectedCategories,
        voiceTranscript: voiceTranscript.trim() || undefined,
      });

      if (result.success) {
        // Primary success toast
        toast.success('Reflection Preserved to the Archive.');

        // If an Echo was generated, show it in a special poetic toast
        if (result.echo) {
          const preview = result.echo.length > 90
            ? result.echo.slice(0, 90) + '\u2026'
            : result.echo;
          setTimeout(() => {
            toast.success(`\u2728 Echo\u2009\u2014\u2009\u201c${preview}\u201d`, {
              duration: 7000,
              description: 'Your poetic reflection has been woven into the Timeline.',
            });
          }, 600);
        }

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#004c3b', '#d4a017', '#fafaf3']
        });
        if (onSaveSuccess && result.noteId) {
          onSaveSuccess(result.noteId);
        }
        setIsEditing(false);
      } else {
        toast.error('The archive was unable to save your entry.');
      }
    } catch (err) {
      if ((err as { message?: string }).message === 'Unauthorized') {
        toast.error('Session expired — reconnecting.');
        setTimeout(() => {
          window.location.href = '/api/auth/login';
        }, 1500);
      } else {
        toast.error('An error occurred while saving your reflection.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (hasLoggedToday && !isEditing) {
    return (
      <div className="relative overflow-hidden bg-surface-container-high rounded-2xl border border-primary/10 editorial-shadow p-5 md:p-6 parchment-texture">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="text-primary w-5 h-5" />
          <h3 className="font-serif text-xl text-primary">{t('preservedReflection', isoCode)}</h3>
        </div>

        <div className="mb-6">
          <span className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase mb-2 block">{t('sourceAyah', isoCode)}</span>
          <Badge className="bg-tertiary-fixed text-on-tertiary-fixed border-none px-3 py-1">{effectiveVerseKey}</Badge>
        </div>

        <p className="font-body text-sm text-on-surface leading-loose italic mb-4 border-s-2 border-primary/20 ps-4">
          &ldquo;{existingLogText}&rdquo;
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          {existingCategories.map((cat) => (
            <span key={cat} className="font-label text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant/10 text-on-surface-variant">
              {cat}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
          <p className="text-[10px] text-on-surface-variant/70 italic uppercase tracking-widest">
            {t('legacySecure', isoCode)}
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 font-label text-[10px] tracking-widest uppercase text-primary hover:text-primary/70 transition-colors font-bold"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {t('amendEntry', isoCode)}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 editorial-shadow p-5 md:p-6 parchment-texture">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-primary w-3.5 h-3.5" />
        <h3 className="font-serif text-lg text-primary">{t('captureInsight', isoCode)}</h3>
      </div>

      <div className="mb-6 group">
        <span className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase mb-2 block group-focus-within:text-primary transition-colors">
          {t('livingExperience', isoCode)}
        </span>
        <Textarea
          value={logText}
          onChange={(e) => setLogText(e.target.value)}
          placeholder={t('whisperPlaceholder', isoCode)}
          maxLength={maxChars}
          className="min-h-[100px] bg-surface-container-lowest/50 border-outline-variant/20 rounded-xl p-3 text-sm font-body leading-relaxed focus:bg-surface-container-lowest focus:border-primary/30 transition-all placeholder:italic placeholder:text-on-surface-variant/40"
        />
        <div className="flex justify-end mt-2">
          <span className="font-label text-[10px] tracking-widest text-on-surface-variant/50">
            {charCount} / {maxChars} Characters
          </span>
        </div>
      </div>

      <div className="mb-6">
        <span className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase mb-3 block">{t('manifestedVirtues', isoCode)}</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category);
            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1 rounded-full text-[8px] font-bold tracking-[0.1em] uppercase transition-all duration-500 border ${isSelected
                    ? 'silk-gradient text-white border-transparent editorial-shadow scale-105'
                    : 'bg-surface-container-lowest border-outline-variant/10 text-on-surface-variant hover:border-primary/30'
                  }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <VoiceRecorder
          onTranscriptChange={setVoiceTranscript}
          transcript={voiceTranscript}
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={!isValid || isSaving}
        className={`w-full h-12 rounded-xl font-bold tracking-widest uppercase text-[10px] transition-all duration-700 ${isValid && !isSaving
            ? 'silk-gradient text-white editorial-shadow hover:scale-[1.02]'
            : 'bg-surface-container-high text-on-surface-variant opacity-50'
          }`}
      >
        {isSaving ? (
          <span className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {t('preserving', isoCode)}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {t('preserveInsight', isoCode)}
            <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </Button>
    </div>
  );
}
