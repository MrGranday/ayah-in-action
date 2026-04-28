'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, RotateCcw, Square, Loader2, Sparkles, Volume2, AlertCircle } from 'lucide-react';
import type { SpeechRecognition, SpeechRecognitionEvent } from '@/types/pwa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { t } from '@/lib/i18n/uiStrings';
import { formatNumber } from '@/config/languageConfig';

type RecordingState = 'idle' | 'requesting' | 'recording' | 'transcribing' | 'done' | 'error' | 'permission-denied';

interface VoiceRecorderProps {
  onTranscriptChange: (transcript: string) => void;
  transcript: string;
}

export function VoiceRecorder({ onTranscriptChange, transcript }: VoiceRecorderProps) {
  const { activeIsoCode, config } = useLanguageStore();
  const [state, setState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptRef = useRef<string>('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, []);

  const finalizeTranscript = useCallback(() => {
    const final = transcriptRef.current.trim();
    onTranscriptChange(final);
    setState('done');
  }, [onTranscriptChange]);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('error');
      setErrorMessage(t('micError', activeIsoCode));
      toast.error(t('micError', activeIsoCode));
      return;
    }

    try {
      setState('requesting');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType =
        ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find((t) =>
          MediaRecorder.isTypeSupported(t)
        ) || '';

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      transcriptRef.current = '';
      setLiveTranscript('');

      const RecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (RecognitionClass) {
        const recognition = new RecognitionClass();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = config.speechLang;

        recognition.onresult = (e: SpeechRecognitionEvent) => {
          let interim = '';
          let final = '';
          for (let i = 0; i < e.results.length; i++) {
            const result = e.results[i];
            if ((result as any).isFinal) {
              final += result[0].transcript;
            } else {
              interim += result[0].transcript;
            }
          }
          transcriptRef.current = final;
          setLiveTranscript(final + interim);
        };

        recognition.onerror = (e: any) => {
          console.warn('[SpeechRecognition] Error:', e.error);
          if (e.error === 'not-allowed') {
            setState('permission-denied');
            setErrorMessage(t('micDenied', activeIsoCode));
            toast.error(t('micDenied', activeIsoCode));
          }
        };

        try {
          recognition.start();
        } catch (recognitionErr) {
          console.warn('[SpeechRecognition] Could not start:', recognitionErr);
        }
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const actualMime = mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: actualMime });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        setState('transcribing');
        setTimeout(() => {
          finalizeTranscript();
        }, 800);
      };

      mediaRecorder.start(100);
      setState('recording');
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 29) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('[VoiceRecorder] Error starting:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setState('permission-denied');
        setErrorMessage(t('micDenied', activeIsoCode));
        toast.error(t('micDenied', activeIsoCode));
      } else if (err?.name === 'NotFoundError') {
        setState('error');
        setErrorMessage(t('noMic', activeIsoCode));
        toast.error(t('noMic', activeIsoCode));
      } else {
        setState('error');
        setErrorMessage(t('micError', activeIsoCode));
        toast.error(t('micError', activeIsoCode));
      }
    }
  };

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reRecord = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingTime(0);
    setLiveTranscript('');
    transcriptRef.current = '';
    onTranscriptChange('');
    setState('idle');
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.button
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={startRecording}
            className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all group"
          >
            <div className="p-1.5 rounded-full bg-surface-container-lowest editorial-shadow text-primary group-hover:scale-110 transition-transform">
              <Mic className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-label tracking-[0.2em] uppercase font-bold text-primary/60">
              {t('archiveVoice', activeIsoCode)}
            </span>
          </motion.button>
        )}

        {state === 'requesting' && (
          <motion.div key="requesting" className="flex items-center gap-3 px-5 py-2.5">
            <Loader2 className="w-4 h-4 text-primary/40 animate-spin" />
            <span className="text-[10px] font-label tracking-widest uppercase text-primary/40 italic">
              {t('micRequesting', activeIsoCode)}
            </span>
          </motion.div>
        )}

        {state === 'recording' && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-container-lowest rounded-2xl p-5 border border-red-200/50 editorial-shadow space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-end gap-0.5 h-8">
                  {[...Array(10)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [6, 22, 10, 26, 6] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.06, ease: 'easeInOut' }}
                      className="w-1 bg-red-400 rounded-full"
                    />
                  ))}
                </div>
                <div className="space-y-0.5">
                  <span className="block text-[10px] font-label tracking-widest uppercase text-red-500 font-bold">
                    {t('recording', activeIsoCode)}
                  </span>
                  <span className="text-lg font-serif text-primary">
                    {formatNumber(Math.floor(recordingTime / 60), activeIsoCode)}:{formatNumber(recordingTime % 60, activeIsoCode).padStart(2, formatNumber(0, activeIsoCode))}
                    <span className="text-sm opacity-30 ml-1">/ {formatNumber(0, activeIsoCode)}:{formatNumber(30, activeIsoCode)}</span>
                  </span>
                </div>
              </div>
              <button
                onClick={stopRecording}
                className="w-11 h-11 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors"
                title={t('stopRecording' as any, activeIsoCode)}
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            </div>

            {liveTranscript && (
              <div className="bg-primary/5 rounded-xl px-4 py-2.5 border border-primary/10">
                <span className="text-[9px] font-label tracking-widest uppercase text-primary/40 block mb-1">
                  {t('liveTranscript' as any, activeIsoCode)}
                </span>
                <p className="text-xs font-body italic text-on-surface-variant leading-relaxed line-clamp-2">
                  {liveTranscript}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {state === 'transcribing' && (
          <motion.div key="transcribing" className="flex items-center gap-3 px-5 py-2.5">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[10px] font-label tracking-widest uppercase text-primary font-bold">
              {t('finalizingTranscript', activeIsoCode)}
            </span>
          </motion.div>
        )}

        {(state === 'error' || state === 'permission-denied') && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-2xl bg-red-500/5 border border-red-200/50 flex items-start gap-3"
          >
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div className="space-y-2 flex-1">
              <p className="text-[10px] font-label tracking-widest uppercase text-red-600 font-bold">
                {state === 'permission-denied' ? t('permissionRequired' as any, activeIsoCode) : t('error', activeIsoCode)}
              </p>
              <p className="text-xs font-body text-on-surface-variant leading-relaxed">{errorMessage}</p>
              <button
                onClick={() => setState('idle')}
                className="text-[10px] font-bold tracking-widest uppercase text-primary hover:underline"
              >
                {t('tryAgain', activeIsoCode)}
              </button>
            </div>
          </motion.div>
        )}

        {state === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-surface-container-high rounded-2xl p-5 border border-outline-variant/10 parchment-texture space-y-4 editorial-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary/60">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-[10px] font-label tracking-widest uppercase font-bold">
                    {t('voicePreserved', activeIsoCode)}
                  </span>
                </div>
                <button
                  onClick={reRecord}
                  className="flex items-center gap-2 text-[10px] font-label tracking-widest uppercase text-primary hover:underline font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t('reset' as any, activeIsoCode)}
                </button>
              </div>

              {audioUrl && (
                <div className="bg-surface-container-highest/50 p-2 rounded-xl backdrop-blur-sm border border-outline-variant/10">
                  <audio src={audioUrl} controls className="w-full h-10" />
                </div>
              )}

              <div className="space-y-2">
                <span className="text-[10px] font-label tracking-widest uppercase text-on-surface-variant/40 block">
                  {t('digitalTranscript', activeIsoCode)} {!transcript && <span className="text-on-surface-variant/30">({t('editOrAdd' as any, activeIsoCode)})</span>}
                </span>
                <textarea
                  value={transcript}
                  onChange={(e) => onTranscriptChange(e.target.value)}
                  placeholder={t('transcriptPlaceholder', activeIsoCode)}
                  className="w-full bg-surface-container-lowest/40 border border-outline-variant/5 rounded-xl p-4 text-sm font-body italic text-on-surface-variant focus:bg-surface-container-lowest focus:border-primary/20 transition-all outline-none min-h-[80px] resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
