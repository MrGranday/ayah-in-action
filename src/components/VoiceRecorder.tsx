'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, RotateCcw, Square, Loader2, Sparkles, Volume2 } from 'lucide-react';
import type { SpeechRecognition, SpeechRecognitionEvent } from '@/types/pwa';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptRef = useRef<string>('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    if (!navigator.mediaDevices) {
      setState('error');
      setErrorMessage('Microphone access is unavailable in this environment.');
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

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      const recognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (recognitionClass) {
        const recognition = new recognitionClass();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onresult = (e: SpeechRecognitionEvent) => {
          let fullTranscript = '';
          for (let i = 0; i < e.results.length; i++) {
            fullTranscript += e.results[i][0].transcript;
          }
          transcriptRef.current = fullTranscript;
        };
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState('done');

        if (recognitionRef.current) {
          setState('transcribing');
          setTimeout(() => {
            onTranscriptChange(transcriptRef.current);
            setState('done');
          }, 1000);
        } else {
          onTranscriptChange('');
        }
      };

      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      mediaRecorder.start();
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
    } catch (err) {
      console.error('Microphone error:', err);
      if ((err as { name: string }).name === 'NotAllowedError') {
        setState('permission-denied');
        setErrorMessage('Access denied. Please enable your microphone.');
      } else {
        setState('error');
        setErrorMessage('Could not initiate audio archive.');
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const reRecord = () => {
    setAudioUrl(null);
    setRecordingTime(0);
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
            <span className="text-[10px] font-label tracking-[0.2em] uppercase font-bold text-primary/60">Archive Voice Reflection</span>
          </motion.button>
        )}

        {state === 'requesting' && (
          <motion.div key="requesting" className="flex items-center gap-3 px-5 py-2.5">
            <Loader2 className="w-4 h-4 text-primary/40 animate-spin" />
            <span className="text-[10px] font-label tracking-widest uppercase text-primary/40 italic">Initializing...</span>
          </motion.div>
        )}

        {state === 'recording' && (
          <motion.div 
            key="recording"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface-container-lowest rounded-2xl p-6 border border-destructive/20 flex items-center justify-between editorial-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-end gap-1 h-8">
                {[...Array(12)].map((_, i) => (
                  <motion.div 
                    key={i} 
                    animate={{ height: [8, 24, 12, 28, 8] }}
                    transition={{ 
                      duration: 0.8, 
                      repeat: Infinity, 
                      delay: i * 0.05,
                      ease: "easeInOut"
                    }}
                    className="w-1 bg-red-400 rounded-full" 
                  />
                ))}
              </div>
              <div className="space-y-1">
                <span className="block text-[10px] font-label tracking-widest uppercase text-red-500 font-bold">Recording Archive</span>
                <span className="text-xl font-serif text-primary">
                  {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')} <span className="opacity-20">/ 0:30</span>
                </span>
              </div>
            </div>
            <button
              onClick={stopRecording}
              className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          </motion.div>
        )}

        {state === 'transcribing' && (
          <motion.div key="transcribing" className="flex items-center gap-3 px-5 py-2.5">
            <Sparkles className="w-4 h-4 text-gold animate-pulse" />
            <span className="text-[10px] font-label tracking-widest uppercase text-gold font-bold">Transcribing Wisdom...</span>
          </motion.div>
        )}

        {(state === 'error' || state === 'permission-denied') && (
          <motion.div 
            key="error"
            className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-3"
          >
            <p className="text-[10px] font-label tracking-widest uppercase text-destructive font-bold">{errorMessage}</p>
            <button
              onClick={() => setState('idle')}
              className="text-[10px] font-bold tracking-widest uppercase text-primary hover:underline"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {state === 'done' && (
          <motion.div 
            key="done"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-surface-container-high rounded-2xl p-6 border border-outline-variant/10 parchment-texture space-y-4 editorial-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary/60">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-[10px] font-label tracking-widest uppercase font-bold">Audio Asset Preserved</span>
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
                <span className="text-[10px] font-label tracking-widest uppercase text-on-surface-variant/40 block">Digital Transcript</span>
                <textarea
                  value={transcript}
                  onChange={(e) => onTranscriptChange(e.target.value)}
                  placeholder="The spoken word manifests here..."
                  className="w-full bg-surface-container-lowest/40 border border-outline-variant/5 rounded-xl p-4 text-sm font-body italic text-on-surface-variant focus:bg-surface-container-lowest focus:border-primary/20 transition-all outline-none min-h-[100px]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
