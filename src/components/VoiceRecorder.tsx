'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, RotateCcw, Square, Loader2, Sparkles, Volume2, AlertCircle } from 'lucide-react';
import type { SpeechRecognition, SpeechRecognitionEvent } from '@/types/pwa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

type RecordingState = 'idle' | 'requesting' | 'recording' | 'transcribing' | 'done' | 'error' | 'permission-denied';

interface VoiceRecorderProps {
  onTranscriptChange: (transcript: string) => void;
  transcript: string;
}

export function VoiceRecorder({ onTranscriptChange, transcript }: VoiceRecorderProps) {
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
  const recognitionDoneRef = useRef(false);

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
    // Check for microphone API
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('error');
      setErrorMessage('Microphone access is unavailable. Please use HTTPS or allow microphone permission.');
      toast.error('Microphone not accessible. Make sure you are on HTTPS.');
      return;
    }

    try {
      setState('requesting');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Pick best audio format
      const mimeType =
        ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find((t) =>
          MediaRecorder.isTypeSupported(t)
        ) || '';

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      recognitionDoneRef.current = false;
      transcriptRef.current = '';
      setLiveTranscript('');

      // ── Web Speech API setup ─────────────────────────────────────────────────
      const RecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (RecognitionClass) {
        const recognition = new RecognitionClass();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true; // enable interim so we update live display
        recognition.lang = 'en-US';

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
          // Accumulate final parts + show interim live
          transcriptRef.current = final;
          setLiveTranscript(final + interim);
        };

        recognition.onend = () => {
          // Speech recognition stopped (either manually or due to silence)
          // Mark it done so onstop knows recognition has finished
          recognitionDoneRef.current = true;
        };

        recognition.onerror = (e: any) => {
          console.warn('[SpeechRecognition] Error:', e.error);
          if (e.error === 'not-allowed') {
            setState('permission-denied');
            setErrorMessage('Microphone permission denied for speech recognition.');
            toast.error('Microphone permission denied.');
          } else if (e.error !== 'aborted' && e.error !== 'no-speech') {
            // no-speech is normal (silence), aborted is manual stop — ignore both
            toast.warning(`Speech recognition issue: ${e.error}. The audio recording continues.`);
          }
        };

        try {
          recognition.start();
        } catch (recognitionErr) {
          console.warn('[SpeechRecognition] Could not start:', recognitionErr);
          // Non-fatal — recording still works, just without transcript
        }
      }

      // ── MediaRecorder setup ──────────────────────────────────────────────────
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        // Build playback URL
        const actualMime = mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: actualMime });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // If SpeechRecognition has already fired onend, finalize immediately.
        // Otherwise wait a tick for any remaining onresult events to fire.
        setState('transcribing');
        setTimeout(() => {
          finalizeTranscript();
        }, 800);
      };

      mediaRecorder.start(100); // collect data every 100ms for smoother chunks
      setState('recording');
      setRecordingTime(0);

      // Auto-stop at 30 seconds
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
        setErrorMessage('Microphone permission denied. Please allow microphone access in your browser settings.');
        toast.error('Microphone permission denied. Check your browser settings.');
      } else if (err?.name === 'NotFoundError') {
        setState('error');
        setErrorMessage('No microphone found. Please connect a microphone and try again.');
        toast.error('No microphone device found.');
      } else {
        setState('error');
        setErrorMessage('Could not start recording. Please try again.');
        toast.error('Could not start microphone recording.');
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
        {/* ── IDLE ── */}
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
              Archive Voice Reflection
            </span>
          </motion.button>
        )}

        {/* ── REQUESTING ── */}
        {state === 'requesting' && (
          <motion.div key="requesting" className="flex items-center gap-3 px-5 py-2.5">
            <Loader2 className="w-4 h-4 text-primary/40 animate-spin" />
            <span className="text-[10px] font-label tracking-widest uppercase text-primary/40 italic">
              Requesting microphone access...
            </span>
          </motion.div>
        )}

        {/* ── RECORDING ── */}
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
                    Recording
                  </span>
                  <span className="text-lg font-serif text-primary">
                    {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                    <span className="text-sm opacity-30 ml-1">/ 0:30</span>
                  </span>
                </div>
              </div>
              <button
                onClick={stopRecording}
                className="w-11 h-11 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors"
                title="Stop recording"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            </div>

            {/* Live transcript preview */}
            {liveTranscript && (
              <div className="bg-primary/5 rounded-xl px-4 py-2.5 border border-primary/10">
                <span className="text-[9px] font-label tracking-widest uppercase text-primary/40 block mb-1">
                  Live Transcript
                </span>
                <p className="text-xs font-body italic text-on-surface-variant leading-relaxed line-clamp-2">
                  {liveTranscript}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TRANSCRIBING ── */}
        {state === 'transcribing' && (
          <motion.div key="transcribing" className="flex items-center gap-3 px-5 py-2.5">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[10px] font-label tracking-widest uppercase text-primary font-bold">
              Finalizing transcript...
            </span>
          </motion.div>
        )}

        {/* ── ERROR / PERMISSION DENIED ── */}
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
                {state === 'permission-denied' ? 'Permission Required' : 'Recording Error'}
              </p>
              <p className="text-xs font-body text-on-surface-variant leading-relaxed">{errorMessage}</p>
              <button
                onClick={() => setState('idle')}
                className="text-[10px] font-bold tracking-widest uppercase text-primary hover:underline"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {/* ── DONE ── */}
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
                    Voice Archive Preserved
                  </span>
                </div>
                <button
                  onClick={reRecord}
                  className="flex items-center gap-2 text-[10px] font-label tracking-widest uppercase text-primary hover:underline font-bold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>

              {audioUrl && (
                <div className="bg-surface-container-highest/50 p-2 rounded-xl backdrop-blur-sm border border-outline-variant/10">
                  <audio src={audioUrl} controls className="w-full h-10" />
                </div>
              )}

              <div className="space-y-2">
                <span className="text-[10px] font-label tracking-widest uppercase text-on-surface-variant/40 block">
                  Digital Transcript {!transcript && <span className="text-on-surface-variant/30">(edit or add manually)</span>}
                </span>
                <textarea
                  value={transcript}
                  onChange={(e) => onTranscriptChange(e.target.value)}
                  placeholder="The spoken word manifests here... (you can type or edit)"
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
