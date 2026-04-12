'use client';

import { useState } from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { VoiceRecorder } from './VoiceRecorder';
import { CATEGORIES, type Category } from '@/types/log';
import { saveApplicationLog } from '@/app/actions/log';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { Sparkles, Edit3, ArrowRight, CheckCircle2 } from 'lucide-react';

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
  const [logText, setLogText] = useState(existingLogText);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(existingCategories);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
        verseKey,
        logText: logText.trim(),
        categories: selectedCategories,
        voiceTranscript: voiceTranscript.trim() || undefined,
      });

      if (result.success) {
        toast.success('Reflection Preserved.');
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
      <div className="relative overflow-hidden bg-surface-container-high rounded-[2rem] border border-primary/10 editorial-shadow p-8 md:p-10 parchment-texture">
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle2 className="text-primary w-6 h-6" />
          <h3 className="font-serif text-2xl text-primary">Preserved Reflection</h3>
        </div>

        <div className="mb-6">
          <span className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase mb-2 block">Source Ayah</span>
          <Badge className="bg-tertiary-fixed text-on-tertiary-fixed border-none px-3 py-1">{verseKey}</Badge>
        </div>

        <p className="font-body text-lg text-on-surface leading-loose italic mb-8 border-l-2 border-primary/20 pl-6">
          &ldquo;{existingLogText}&rdquo;
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          {existingCategories.map((cat) => (
            <span key={cat} className="font-label text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full bg-white border border-outline-variant/10 text-on-surface-variant">
              {cat}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10">
          <p className="text-xs text-on-surface-variant/70 italic">
            Your legacy for today is secure. MashaAllah.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 font-label text-[10px] tracking-widest uppercase text-primary hover:text-primary/70 transition-colors font-bold"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Amend Entry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low rounded-[2rem] border border-outline-variant/10 editorial-shadow p-8 md:p-10 parchment-texture">
      <div className="flex items-center gap-3 mb-8">
        <Sparkles className="text-primary w-5 h-5" />
        <h3 className="font-serif text-2xl text-primary">Capture the Insight</h3>
      </div>

      <div className="mb-8 group">
        <span className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase mb-3 block group-focus-within:text-primary transition-colors">
          The Living Experience
        </span>
        <Textarea
          value={logText}
          onChange={(e) => setLogText(e.target.value)}
          placeholder="How did these words manifest in your day today?"
          maxLength={maxChars}
          className="min-h-[160px] bg-white/50 border-outline-variant/20 rounded-2xl p-5 text-lg font-body leading-relaxed focus:bg-white focus:border-primary/30 transition-all placeholder:italic placeholder:text-on-surface-variant/40"
        />
        <div className="flex justify-end mt-2">
          <span className="font-label text-[10px] tracking-widest text-on-surface-variant/50">
            {charCount} / {maxChars} Characters
          </span>
        </div>
      </div>

      <div className="mb-10">
        <span className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase mb-4 block">Manifested Virtues</span>
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategories.includes(category);
            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-5 py-2 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase transition-all duration-500 border ${isSelected
                    ? 'silk-gradient text-white border-transparent editorial-shadow scale-105'
                    : 'bg-white border-outline-variant/10 text-on-surface-variant hover:border-primary/30'
                  }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-12">
        <VoiceRecorder
          onTranscriptChange={setVoiceTranscript}
          transcript={voiceTranscript}
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={!isValid || isSaving}
        className={`w-full h-16 rounded-2xl font-bold tracking-widest uppercase text-xs transition-all duration-700 ${isValid && !isSaving
            ? 'silk-gradient text-white editorial-shadow hover:scale-[1.02]'
            : 'bg-surface-container-high text-on-surface-variant opacity-50'
          }`}
      >
        {isSaving ? (
          <span className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Preserving...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Preserve to Archive
            <ArrowRight className="w-4 h-4" />
          </span>
        )}
      </Button>
    </div>
  );
}
