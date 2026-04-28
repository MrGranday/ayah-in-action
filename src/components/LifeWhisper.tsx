'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, Send, X, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { suggestAyahFromChallenge } from '@/app/actions/whisper';
import { useAyahStore } from '@/stores/useAyahStore';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const LifeWhisper = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [challenge, setChallenge] = useState('');
  const { 
    whisperAyah, 
    setWhisperAyah, 
    isWhisperLoading, 
    setIsWhisperLoading,
    setCurrentAyah 
  } = useAyahStore();
  const activeIsoCode = useLanguageStore((state) => state.activeIsoCode);
  const activeDirection = useLanguageStore((state) => state.config.direction);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleWhisper = async () => {
    if (!challenge.trim()) return;
    
    setIsWhisperLoading(true);
    setWhisperAyah(null);
    
    try {
      const ayah = await suggestAyahFromChallenge(challenge);
      if (ayah) {
        setWhisperAyah(ayah);
      } else {
        toast.error("The Whisper didn't find a direct connection. Try rephrasing your challenge.");
      }
    } catch (error) {
      toast.error("A whisper in the wind... connection failed. Please try again.");
    } finally {
      setIsWhisperLoading(false);
    }
  };

  const handleApply = () => {
    if (whisperAyah) {
      setCurrentAyah(whisperAyah);
      setIsOpen(false);
      // Optional: Scroll to top or to the log form
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success("Guidance applied to your journal. Time to reflect.");
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full silk-gradient editorial-shadow flex items-center justify-center text-white z-40 hover:scale-110 transition-transform"
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Sparkles className="w-8 h-8" />
      </motion.button>

      {/* Backdrop & Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              className="fixed bottom-8 right-8 w-full max-w-md glass-morphism parchment-texture rounded-3xl p-6 z-50 overflow-hidden min-h-[400px] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="font-serif text-xl text-primary">Life Whisper Guidance</h2>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-black/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 opacity-40" />
                </button>
              </div>

              {!whisperAyah ? (
                <div className="flex-1 flex flex-col gap-4">
                  <p className="font-serif text-lg leading-relaxed text-on-surface/80 italic">
                    &quot;Describe a challenge or a feeling you are facing today. Let the wisdom find you.&quot;
                  </p>
                  
                  <div className="relative mt-4">
                    <textarea
                      ref={inputRef}
                      value={challenge}
                      onChange={(e) => setChallenge(e.target.value)}
                      placeholder="I'm feeling a bit overwhelmed with work lately..."
                      className="w-full bg-transparent border-b-2 border-outline-variant focus:border-primary outline-none py-3 px-1 font-sans resize-none min-h-[120px] text-lg transition-colors"
                    />
                    <div className="absolute right-0 bottom-3">
                      <Button
                        onClick={handleWhisper}
                        disabled={!challenge.trim() || isWhisperLoading}
                        className="rounded-full h-12 w-12 p-0 silk-gradient"
                      >
                        {isWhisperLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-6 opacity-40 flex items-center gap-2 text-xs uppercase tracking-widest font-label">
                     <span>Powered by QF Semantic Search</span>
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="bg-surface-container-low rounded-2xl p-5 mb-6 border border-primary/10 ayah-enter">
                    <div className="flex justify-between items-start mb-4">
                       <span className="text-xs font-label opacity-40 uppercase tracking-tighter">Ayah {whisperAyah.verse_key}</span>
                       <BookOpen className="w-4 h-4 text-primary/30" />
                    </div>
                    
                    <p className="text-right mb-4">
                      <span className="quran-text text-primary" dir="rtl" lang="ar">
                        {whisperAyah.text_uthmani}
                      </span>
                    </p>
                    
                    <p className="font-serif text-base text-on-surface/90 leading-relaxed italic border-l-2 border-gold/30 pl-4 py-1">
                      <span dir={activeDirection} lang={activeIsoCode}>
                        {whisperAyah.translation}
                      </span>
                    </p>
                  </div>

                  <div className="mt-auto space-y-3">
                    <Button 
                      onClick={handleApply}
                      className="w-full h-14 rounded-2xl silk-gradient text-lg font-serif editorial-shadow"
                    >
                      Log this application
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                    <button 
                      onClick={() => {
                        setWhisperAyah(null);
                        setChallenge('');
                      }}
                      className="w-full py-2 text-sm text-primary/60 hover:text-primary transition-colors font-label uppercase tracking-widest"
                    >
                      Try another whisper
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
