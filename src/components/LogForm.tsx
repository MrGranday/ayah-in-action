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

interface LogFormProps {
  hasLoggedToday: boolean;
  verseKey: string;
  existingLogText?: string;
  existingCategories?: Category[];
  existingLogId?: string;
  onSaveSuccess?: (logId: string) => void;
}

export function LogForm({
  hasLoggedToday,
  verseKey,
  existingLogText = '',
  existingCategories = [],
  existingLogId,
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
        toast.success('Saved! Application logged.');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        if (onSaveSuccess && result.noteId) {
          onSaveSuccess(result.noteId);
        }
      } else {
        toast.error('Could not save. Tap to retry.');
      }
    } catch (err) {
      if ((err as { message?: string }).message === 'Unauthorized') {
        toast.error('Session expired — logging you in again.');
        setTimeout(() => {
          window.location.href = '/api/auth/login';
        }, 1500);
      } else {
        toast.error('Could not save. Tap to retry.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (hasLoggedToday && !isEditing) {
    return (
      <div className="parchment p-6 border-l-4 border-l-emerald">
        <h3 className="text-lg font-semibold mb-3">Your reflection for today</h3>
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="gold">{verseKey}</Badge>
        </div>
        <p className="text-text-muted mb-4">
          {existingLogText.length > 120
            ? existingLogText.substring(0, 120) + '...'
            : existingLogText}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {existingCategories.map((cat) => (
            <Badge key={cat} variant="secondary" className="text-xs">
              {cat}
            </Badge>
          ))}
        </div>
        <p className="text-text-muted italic mb-4">
          You&apos;ve already applied this ayah today. Come back tomorrow for a new one. MashaAllah.
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm text-emerald hover:underline"
        >
          Edit today&apos;s log
        </button>
      </div>
    );
  }

  return (
    <div className="parchment p-6">
      <h3 className="text-lg font-semibold mb-4">Today this ayah helped me when…</h3>

      <Textarea
        value={logText}
        onChange={(e) => setLogText(e.target.value)}
        placeholder="Be honest. Even one moment counts."
        maxLength={maxChars}
        className="min-h-[120px] mb-2"
      />
      <p className="text-right text-xs text-text-muted mb-4">
        {charCount} / {maxChars}
      </p>

      <div className="mb-4">
        <p className="text-sm font-medium mb-3">How did it apply?</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`tag-chip px-3 py-1.5 rounded-full text-sm ${
                selectedCategories.includes(category) ? 'selected' : ''
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <VoiceRecorder
          onTranscriptChange={setVoiceTranscript}
          transcript={voiceTranscript}
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={!isValid || isSaving}
        className="w-full btn-save"
      >
        {isSaving ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Saving...
          </span>
        ) : (
          'Save Application'
        )}
      </Button>
    </div>
  );
}
