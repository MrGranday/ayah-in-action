'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, RotateCcw } from 'lucide-react';
import type { SpeechRecognition, SpeechRecognitionEvent } from '@/types/pwa';

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

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    if (!navigator.mediaDevices) {
      setState('error');
      setErrorMessage('Microphone not available. You can type your reflection instead.');
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

      let recognition: SpeechRecognition | null = null;
      if (recognitionClass) {
        recognition = new recognitionClass();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onresult = (e: SpeechRecognitionEvent) => {
          let transcripts = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            transcripts += e.results[i][0].transcript;
          }
          transcriptRef.current = transcripts;
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

        if (recognition) {
          setState('transcribing');
          setTimeout(() => {
            onTranscriptChange(transcriptRef.current);
            setState('done');
          }, 1000);
        } else {
          onTranscriptChange('');
        }
      };

      if (recognition) {
        recognition.start();
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
        setErrorMessage('Mic access denied. Enable it in browser settings or type your note.');
      } else if ((err as { name: string }).name === 'NotFoundError') {
        setState('error');
        setErrorMessage('No microphone found on this device.');
      } else {
        setState('error');
        setErrorMessage('Microphone error. Please try again.');
      }
    }
  };

  const stopRecording = () => {
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

  const handleTranscriptChange = (value: string) => {
    transcriptRef.current = value;
    onTranscriptChange(value);
  };

  if (state === 'idle') {
    return (
      <button
        onClick={startRecording}
        className="flex items-center gap-2 text-text-muted hover:text-emerald transition-colors"
      >
        <Mic className="w-4 h-4" />
        <span className="text-sm">Add Voice Note</span>
      </button>
    );
  }

  if (state === 'requesting') {
    return (
      <div className="flex items-center gap-2 text-text-muted">
        <span className="text-sm">Checking microphone...</span>
      </div>
    );
  }

  if (state === 'recording') {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="waveform-bar" />
            ))}
          </div>
          <span className="text-sm text-red-500">
            {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')} / 0:30
          </span>
        </div>
        <button
          onClick={stopRecording}
          className="text-sm text-red-500 hover:text-red-600"
        >
          Stop Recording
        </button>
      </div>
    );
  }

  if (state === 'transcribing') {
    return (
      <div className="flex items-center gap-2 text-text-muted">
        <span className="text-sm">Transcribing...</span>
      </div>
    );
  }

  if (state === 'permission-denied' || state === 'error') {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-red-500">{errorMessage}</p>
        <button
          onClick={() => setState('idle')}
          className="text-sm text-emerald hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (state === 'done') {
    return (
      <div className="flex flex-col gap-3">
        {audioUrl && (
          <audio src={audioUrl} controls className="w-full h-8" />
        )}
        <textarea
          value={transcript}
          onChange={(e) => handleTranscriptChange(e.target.value)}
          placeholder="Edit transcript if needed..."
          className="flex min-h-[60px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <button
          onClick={reRecord}
          className="flex items-center gap-1 text-sm text-text-muted hover:text-emerald"
        >
          <RotateCcw className="w-3 h-3" />
          Re-record
        </button>
      </div>
    );
  }

  return null;
}
