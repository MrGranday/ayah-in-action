'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2, BookOpen, Quote, ChevronRight, History, AlertCircle, Bookmark, Play, Pause } from 'lucide-react';
import { generateWhisper } from '@/app/actions/generateWhisper';
import { getApiKeyStatus } from '@/app/actions/keys';
import { getWhisperHistory } from '@/app/actions/whisper';
import { saveApplicationLog } from '@/app/actions/log';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { t } from '@/lib/i18n/uiStrings';

export default function WhisperPage() {
  const [challenge, setChallenge] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [freeTierNotice, setFreeTierNotice] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [keysActive, setKeysActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const isoCode = useLanguageStore((state) => state.activeIsoCode);

  useEffect(() => {
    getApiKeyStatus().then(res => setKeysActive(res.hasClaude || res.hasOpenAI || res.hasGemini || res.hasGroq || res.hasHf));
    getWhisperHistory().then((h) => { setHistory(h); setVisibleCount(5); });
  }, []);

  // Pre-instantiate audio object when result changes
  useEffect(() => {
    if (result?.audio_url) {
      const audioEl = new Audio(result.audio_url);
      audioEl.onended = () => setIsPlaying(false);
      setAudio(audioEl);
    }
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [result?.audio_url]);

  const toggleAudio = () => {
    if (!audio) {
      toast.error(t('audioError', isoCode));
      return;
    }
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(() => toast.error(t('browserBlockedAudio', isoCode)));
      setIsPlaying(true);
    }
  };

  const handleGenerate = async () => {
    if (!challenge.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateWhisper(challenge);
      if (res.error) setError(res.error);
      else {
        setResult(res.data);
        setFreeTierNotice(!!res.freeTierNotice);
        if (audio) { audio.pause(); setAudio(null); setIsPlaying(false); }
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8B7355', '#D4AF37', '#F5F5DC']
        });
      }
    } catch (err) {
      setError(t('guidanceInterrupted', isoCode));
    } finally {
      setLoading(false);
    }
  };

  const handleLog = async () => {
    if (!result) return;
    setSavingNote(true);
    try {
      const res = await saveApplicationLog({
        verseKey: result.verse_key,
        logText: result.guidance + " | " + result.reflection,
        categories: ['Reflection'],
        type: 'whisper',
        challenge: challenge,
        arabic: result.arabic || result.text_uthmani,
        translation: result.translation,
        guidance: result.guidance,
        reflection: result.reflection
      });
      if (res.success) {
        toast.success(t('reflectionPreserved', isoCode));
        getWhisperHistory().then(setHistory);
      } else {
        toast.error(t('archiveError', isoCode));
      }
    } catch {
      toast.error(t('saveError', isoCode));
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface parchment-texture overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 lg:py-24">
        {/* ── Header ── */}
        <header className="mb-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary mx-auto mb-6">
            <Sparkles className="w-8 h-8 opacity-70" />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-primary leading-tight">
            {t('navWhisper', isoCode)}
          </h1>
          <p className="font-body text-on-surface-variant italic max-w-xl mx-auto text-lg">
            {t('whisperDescription', isoCode)}
          </p>
        </header>

        {/* ── Input Area ── */}
        <section className="mb-12 relative group">
          <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-[3rem]" />
          <div className={cn(
            "relative z-10 bg-surface-container-low rounded-[2rem] md:rounded-[3rem] border transition-all duration-700 p-2 md:p-3",
            keysActive ? "border-outline-variant/10 shadow-xl" : "border-red-200/50 grayscale-[0.8] opacity-60"
          )}>
            <div className="flex flex-col md:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <input
                  value={challenge}
                  onChange={(e) => setChallenge(e.target.value)}
                  placeholder={t('describeChallenge', isoCode)}
                  disabled={!keysActive || loading}
                  className="w-full bg-transparent border-none py-6 px-8 text-xl font-body outline-none placeholder:italic placeholder:text-on-surface-variant/30"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!keysActive || loading || !challenge.trim()}
                className="w-full md:w-auto h-16 px-10 rounded-full silk-gradient text-white editorial-shadow hover:scale-[1.02] active:scale-[0.98] transition-all gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-label text-xs tracking-widest uppercase font-bold">{t('loading', isoCode)}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span className="font-label text-xs tracking-widest uppercase font-bold">{t('navWhisper', isoCode).split(' ')[0]}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {!keysActive && (
            <div className="mt-6 flex flex-col items-center gap-4 text-center">
               <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-label text-[10px] tracking-widest uppercase font-bold">{t('activeKeysRequired', isoCode)}</span>
               </div>
               <Link href="/settings">
                  <Button variant="outline" className="rounded-full border-red-200 text-red-600 hover:bg-red-50 px-6">
                    {t('configureKeys', isoCode)}
                  </Button>
               </Link>
            </div>
          )}
        </section>

        {/* ── Results Display ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-24 text-center space-y-6"
            >
              <div className="relative inline-block">
                 <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse rounded-full" />
                 <Loader2 className="w-16 h-16 text-primary/20 animate-spin relative z-10" />
              </div>
              <p className="font-label text-xs tracking-[0.3em] uppercase text-primary/40 animate-pulse">
                {t('listeningForGuidance', isoCode)}
              </p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-12 px-8 rounded-3xl bg-red-50 border border-red-100 text-center"
            >
               <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
               <p className="text-red-600 font-body mb-6 italic">{error}</p>
               <Button onClick={handleGenerate} variant="outline" className="rounded-full border-red-200 text-red-600 hover:bg-red-100 px-8">
                 {t('tryAgain', isoCode)}
               </Button>
            </motion.div>
          ) : result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {freeTierNotice && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl px-6 py-4 flex gap-3 items-center">
                   <AlertCircle className="w-4 h-4 text-blue-400" />
                   <p className="text-[10px] text-blue-600 font-label tracking-widest uppercase italic leading-relaxed">
                     {t('freeTierShallower', isoCode)}
                   </p>
                </div>
              )}

              {/* Guided Verse Card */}
              <div className="bg-surface-container-highest rounded-[3rem] p-8 md:p-16 editorial-shadow parchment-texture border border-primary/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 text-primary/5 opacity-50 group-hover:scale-110 transition-transform duration-1000">
                  <BookOpen className="w-48 h-48 stroke-[1px]" />
                </div>
                
                <div className="relative z-10 space-y-12">
                   {/* Arabic Verse */}
                   <div className="space-y-8">
                      <p className="quran-text text-3xl md:text-4xl lg:text-5xl leading-[2.5] text-primary text-center drop-shadow-sm" dir="rtl" lang="ar">
                         {result.text_uthmani || result.arabic}
                      </p>
                      <div className="max-w-2xl mx-auto text-center">
                         <p className="font-body text-lg md:text-xl text-on-surface leading-loose italic opacity-80">
                           &ldquo;{result.translation}&rdquo;
                         </p>
                         <div className="mt-6 flex items-center justify-center gap-3">
                           <div className="h-px w-8 bg-primary/10" />
                           <span className="font-serif text-xl text-primary">
                             {result.chapter_name || result.chapter_name_english} {result.verse_key}
                           </span>
                           <div className="h-px w-8 bg-primary/10" />
                         </div>
                      </div>
                   </div>

                   {/* Guidance & Reflection */}
                   <div className="grid md:grid-cols-2 gap-12 pt-12 border-t border-primary/5">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                             <Sparkles className="w-4 h-4" />
                           </div>
                           <h3 className="font-serif text-2xl text-primary">{t('theGaze', isoCode)}</h3>
                        </div>
                        <p className="font-body text-base text-on-surface/80 leading-relaxed italic border-s-2 border-primary/20 ps-6">
                           {result.guidance}
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                             <History className="w-4 h-4" />
                           </div>
                           <h3 className="font-serif text-2xl text-secondary">{t('theManifestation', isoCode)}</h3>
                        </div>
                        <p className="font-body text-base text-on-surface-variant leading-relaxed border-s-2 border-secondary/20 ps-6">
                           {result.reflection}
                        </p>
                      </div>
                   </div>

                   {/* Audio & Bookmark Actions */}
                   <div className="flex flex-wrap items-center justify-center gap-6 pt-12">
                      {result.audio_url && (
                        <button
                          onClick={toggleAudio}
                          className="flex items-center gap-3 px-8 py-4 rounded-full silk-gradient text-white editorial-shadow hover:scale-105 active:scale-95 transition-all group"
                        >
                          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                          <span className="font-label text-[10px] tracking-widest uppercase font-bold">
                            {isPlaying ? '...' : t('listen', isoCode)}
                          </span>
                        </button>
                      )}
                      
                      <button
                        onClick={handleLog}
                        disabled={savingNote}
                        className="flex items-center gap-3 px-8 py-4 rounded-full bg-surface-container-lowest border border-outline-variant/10 text-on-surface-variant hover:border-primary/30 transition-all hover:shadow-lg disabled:opacity-50"
                      >
                         {savingNote ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bookmark className="w-5 h-5" />}
                         <span className="font-label text-[10px] tracking-widest uppercase font-bold">
                            {savingNote ? t('preserving', isoCode) : t('preserveInsight', isoCode)}
                         </span>
                      </button>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Whisper History ── */}
        <section className="mt-32">
           <div className="flex items-center justify-between mb-12">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary/40">
                   <History className="w-5 h-5" />
                </div>
                <h2 className="font-serif text-3xl text-primary">{t('whisperHistory', isoCode)}</h2>
             </div>
           </div>

           {history.length === 0 ? (
             <div className="text-center py-20 bg-surface-container-low rounded-[2rem] border border-dashed border-outline-variant/20 parchment-texture">
                <Sparkles className="w-12 h-12 text-primary/10 mx-auto mb-4" />
                <p className="font-body text-on-surface-variant italic">{t('noWhisperHistory', isoCode)}</p>
             </div>
           ) : (
             <div className="space-y-6">
                {history.slice(0, visibleCount).map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="bg-surface-container-low hover:bg-surface-container-high p-8 rounded-[2rem] border border-outline-variant/10 transition-all duration-500 group"
                  >
                    <div className="flex flex-col md:flex-row gap-8 md:items-start">
                       <div className="md:w-48 shrink-0">
                          <span className="font-label text-[9px] tracking-widest uppercase text-on-surface-variant/40 block mb-2 font-bold">
                            {new Date(item.createdAt).toLocaleDateString(isoCode, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <div className="font-serif text-xl text-primary group-hover:text-primary transition-colors">
                             {item.metadata?.verse_key || item.metadata?.verseKey}
                          </div>
                       </div>
                       
                       <div className="flex-1 space-y-4">
                          <p className="font-body text-base text-on-surface/80 leading-relaxed italic line-clamp-2">
                             &ldquo;{item.metadata?.guidance || item.logText.split(' | ')[0]}&rdquo;
                          </p>
                          <div className="flex items-center gap-2 text-primary/40">
                             <ChevronRight className="w-4 h-4" />
                             <span className="font-label text-[9px] tracking-widest uppercase font-bold">{t('livingExperience', isoCode)}</span>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ))}
                
                {history.length > visibleCount && (
                  <div className="text-center pt-8">
                     <Button 
                      onClick={() => setVisibleCount(v => v + 5)}
                      variant="ghost" 
                      className="rounded-full px-12 py-6 font-label text-[10px] tracking-widest uppercase font-bold text-primary/40 hover:text-primary"
                    >
                       {t('loadMore', isoCode)}
                     </Button>
                  </div>
                )}
             </div>
           )}
        </section>
      </div>
    </div>
  );
}
