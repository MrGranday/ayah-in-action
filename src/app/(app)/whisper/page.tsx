'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2, BookOpen, Quote, ChevronRight, History, AlertCircle, Bookmark } from 'lucide-react';
import { generateWhisper } from '@/app/actions/generateWhisper';
import { getApiKeyStatus } from '@/app/actions/keys';
import { getWhisperHistory } from '@/app/actions/whisper';
import { saveApplicationLog } from '@/app/actions/log';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import Link from 'next/link';

export default function WhisperPage() {
  const [challenge, setChallenge] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [keysActive, setKeysActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    getApiKeyStatus().then(res => setKeysActive(res.hasClaude || res.hasOpenAI));
    getWhisperHistory().then(setHistory);
  }, []);

  const handleGenerate = async () => {
    if (!challenge.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateWhisper(challenge);
      if (res.error) setError(res.error);
      else setResult(res.data);
    } catch (err) {
      setError('The divine connection was interrupted. Please try again.');
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
        challenge: challenge
      });
      if (res.success) {
        toast.success('Whisper preserved in your legacy.');
        confetti({
           particleCount: 150,
           spread: 70,
           origin: { y: 0.6 },
           colors: ['#004c3b', '#d4a017']
        });
        // Refresh history
        getWhisperHistory().then(setHistory);
      } else {
        toast.error('The archive is full or unreachable.');
      }
    } catch (err) {
      toast.error('A spiritual error occurred during preservation.');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface parchment-texture overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-8 md:px-16 py-12 lg:py-20">
        
        {/* Asymmetrical Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          
          {/* Left Column: The Seeker (Input) - Narrower/Staggered */}
          <div className="lg:col-span-5 space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div>
              <span className="font-label text-[10px] tracking-[0.4em] uppercase text-primary/60 block mb-6 px-1">
                Spiritual Intelligence
              </span>
              <h1 className="font-serif text-5xl md:text-7xl text-primary mb-6 leading-tight">
                Life Whisper <br /> Guidance
              </h1>
              <p className="font-body text-lg text-on-surface-variant italic max-w-sm leading-relaxed">
                Connect your current life state with the eternal wisdom of the Quran.
              </p>
            </div>

            {!keysActive ? (
              <div className="bg-surface-container-low rounded-[2.5rem] p-10 text-center border border-dashed border-outline-variant/20 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <Sparkles className="w-12 h-12 text-primary/20 mx-auto mb-6" />
                 <h3 className="font-serif text-xl text-primary mb-4">Intelligence required.</h3>
                 <p className="font-body text-sm text-on-surface-variant/70 mb-8 leading-relaxed">
                   Activation requires your own API configuration to keep guidance personal and private.
                 </p>
                 <Link href="/settings">
                    <Button className="w-full py-6 rounded-2xl silk-gradient text-white font-label text-[10px] tracking-widest uppercase font-bold editorial-shadow hover:scale-[1.02] transition-all">
                       Initialize The Atelier
                    </Button>
                 </Link>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-primary/5 rounded-[3rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-700" />
                  <textarea
                    value={challenge}
                    onChange={(e) => setChallenge(e.target.value)}
                    placeholder="Describe what weighs upon your heart today..."
                    className="relative z-10 w-full bg-surface-container-low border-b-2 border-outline-variant/10 rounded-t-[2rem] rounded-b-[0.5rem] p-8 font-body text-xl focus:border-primary/40 outline-none transition-all placeholder:italic placeholder:text-on-surface-variant/20 min-h-[220px] resize-none editorial-shadow"
                  />
                  <div className="absolute bottom-6 right-6 z-20 flex items-center gap-4">
                     {loading && <div className="text-[10px] font-bold tracking-widest text-primary/40 uppercase animate-pulse">Consulting the Scroll...</div>}
                     <Button
                        onClick={handleGenerate}
                        disabled={loading || !challenge.trim()}
                        className="w-14 h-14 rounded-full silk-gradient text-white flex items-center justify-center editorial-shadow hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:grayscale"
                     >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                     </Button>
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 p-5 bg-red-50 rounded-2xl border border-red-100 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-[10px] font-bold tracking-widest uppercase">{error}</p>
                  </motion.div>
                )}

                {/* Local History Subsection */}
                <div className="pt-12">
                   <div className="flex items-center gap-3 mb-8">
                      <History className="w-4 h-4 text-primary/40" />
                      <h4 className="font-label text-[10px] tracking-[0.3em] uppercase text-primary/40 font-bold">Recent Guidance</h4>
                   </div>
                   <div className="space-y-4">
                      {history.length === 0 ? (
                        <p className="text-[10px] italic text-on-surface-variant/30 px-2 tracking-widest uppercase">No whisper threads found.</p>
                      ) : history.map((h, i) => (
                        <motion.button
                           key={h.id}
                           initial={{ opacity: 0, x: -10 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: i * 0.1 }}
                           onClick={() => {
                              setResult(h.metadata);
                              setChallenge(h.metadata.challenge || '');
                           }}
                           className="w-full text-left p-6 rounded-[2rem] bg-surface-container-low border-b-2 border-outline-variant/5 hover:bg-surface-container-high transition-all group flex items-start gap-4"
                        >
                           <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary/30 group-hover:text-primary transition-colors">
                              <Bookmark className="w-3.5 h-3.5" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-xs font-serif text-primary truncate mb-1">{h.metadata.challenge || 'Untyped Challenge'}</p>
                              <p className="text-[9px] font-label text-on-surface-variant/50 uppercase tracking-widest">{new Date(h.date).toLocaleDateString()}</p>
                           </div>
                           <ChevronRight className="w-4 h-4 text-primary/10 group-hover:text-primary transition-colors" />
                        </motion.button>
                      ))}
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: The Whisper (Results) - Staggered/Wider */}
          <div className="lg:col-span-7 lg:pt-32 relative">
             <AnimatePresence mode="wait">
               {!result ? (
                 <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="p-16 text-center border-2 border-dashed border-outline-variant/5 rounded-[4rem] flex flex-col items-center justify-center min-h-[500px]"
                 >
                    <BookOpen className="w-16 h-16 text-primary/5 mb-8" />
                    <h3 className="font-serif text-2xl text-primary/20 italic">Guidance waiting to emerge.</h3>
                 </motion.div>
               ) : (
                 <motion.div
                    key={result.verse_key}
                    initial={{ opacity: 0, x: 40, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -40, scale: 0.95 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10 bg-surface-container-highest rounded-[4rem] p-10 md:p-16 editorial-shadow parchment-texture overflow-hidden border border-primary/5"
                 >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 p-12 text-primary/5 pointer-events-none select-none">
                       <Sparkles className="w-48 h-48" />
                    </div>

                    <div className="relative z-10 space-y-12">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                             <div className="w-16 h-16 rounded-full silk-gradient text-white flex items-center justify-center font-serif text-2xl editorial-shadow">
                                {result.verse_key.split(':')[0]}
                             </div>
                             <div>
                                <h4 className="font-serif text-3xl text-primary">Divine Reflection</h4>
                                <span className="font-label text-xs tracking-widest uppercase text-on-surface-variant/40">
                                   Quran {result.verse_key}
                                </span>
                             </div>
                          </div>
                          <button 
                             onClick={handleLog}
                             disabled={savingNote}
                             className="flex flex-col items-center gap-2 group transition-all"
                          >
                             <div className="w-12 h-12 rounded-2xl bg-primary/5 group-hover:bg-primary group-hover:text-white flex items-center justify-center text-primary transition-all duration-500">
                                {savingNote ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bookmark className="w-5 h-5" />}
                             </div>
                             <span className="text-[8px] font-bold tracking-[0.2em] uppercase text-on-surface-variant group-hover:text-primary transition-colors">Archive</span>
                          </button>
                       </div>

                       <div className="space-y-8">
                          <div className="relative">
                             <Quote className="absolute -top-10 -left-10 w-24 h-24 text-primary/5" />
                             <p className="font-arabic text-5xl leading-[2.5] text-primary text-right mb-10 drop-shadow-sm" dir="rtl">
                                {result.arabic}
                             </p>
                             <div className="h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent w-full mb-10" />
                             <p className="font-body text-xl text-on-surface leading-loose italic text-left pl-8 border-l-3 border-primary/20">
                                &ldquo;{result.translation}&rdquo;
                             </p>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10">
                          <div className="space-y-4">
                             <h5 className="font-label text-[10px] tracking-[0.3em] uppercase text-primary font-bold px-1 border-l-2 border-primary/20">The Gaze</h5>
                             <p className="font-body text-base text-on-surface/80 leading-relaxed italic">
                                {result.guidance}
                             </p>
                          </div>
                          <div className="space-y-4">
                             <h5 className="font-label text-[10px] tracking-[0.3em] uppercase text-secondary font-bold px-1 border-l-2 border-secondary/40">The Manifestation</h5>
                             <p className="font-body text-base text-on-surface-variant leading-relaxed">
                                {result.reflection}
                             </p>
                          </div>
                       </div>

                       <div className="pt-8 text-center">
                          <p className="text-[10px] font-label tracking-[0.4em] uppercase text-primary/30 italic">
                             Whisper generated via personal intelligence.
                          </p>
                       </div>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>

             {/* Staggered Background floating element */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[110%] bg-primary/2 -z-10 rounded-[10rem] rotate-6 blur-3xl opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
