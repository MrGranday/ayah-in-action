'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Globe, Heart, Bookmark, Users } from 'lucide-react';
import { generatePulse } from '@/app/actions/generatePulse';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { t } from '@/lib/i18n/uiStrings';

export default function UmmahPulsePage() {
  const [pulseData, setPulseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isoCode = useLanguageStore((state) => state.isoCode);

  useEffect(() => {
    fetchPulse();
  }, []);

  const fetchPulse = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generatePulse();
      if (res.error) {
        setError(res.error);
      } else {
        setPulseData(res.data);
      }
    } catch {
      setError('Could not connect to the Ummah. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface parchment-texture overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 md:px-12 py-12 lg:py-20">
        <header className="space-y-6 mb-16 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center text-primary mx-auto">
             <Globe className="w-10 h-10 opacity-70" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-7xl text-primary leading-tight">{t('pulseHeader', isoCode)}</h1>
          <p className="font-body text-lg text-on-surface-variant leading-relaxed max-w-2xl mx-auto italic">
             {t('pulseSubheader', isoCode)}
          </p>
        </header>

        <AnimatePresence mode="wait">
          {loading ? (
             <motion.div
               key="loading"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="flex flex-col items-center justify-center py-24 space-y-6"
             >
                <Loader2 className="w-12 h-12 text-primary/30 animate-spin" />
                <p className="font-label text-xs tracking-[0.2em] uppercase text-primary/50 animate-pulse">{t('syncingPulse', isoCode)}</p>
             </motion.div>
          ) : error ? (
             <motion.div
               key="error"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex flex-col items-center justify-center py-24 space-y-6"
             >
                <p className="text-red-500 font-body text-lg max-w-md text-center">{error}</p>
                <Button onClick={fetchPulse} className="rounded-full editorial-shadow px-8 py-6 silk-gradient text-white">{t('tryAgain', isoCode)}</Button>
             </motion.div>
          ) : pulseData && (
             <motion.div
               key="data"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
               className="space-y-16"
             >
                {/* The Intersection Hero */}
                <div className="relative z-10 bg-surface-container-highest rounded-[3rem] p-8 md:p-16 editorial-shadow parchment-texture border border-primary/10 flex flex-col md:flex-row gap-12 items-center">
                   <div className="flex-1 space-y-8">
                     <div className="flex items-start gap-4">
                        <Sparkles className="w-8 h-8 text-secondary shrink-0 mt-1" />
                        <p className="font-body text-xl md:text-2xl text-on-surface leading-loose italic">
                           "{pulseData.personalized_message}"
                        </p>
                     </div>
                   </div>
                   
                   {/* Personal Verse Highlight */}
                   <div className="flex-1 w-full p-8 md:p-12 rounded-[2rem] bg-surface-container-low border border-primary/5">
                      <p className="font-arabic text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-[2.2] text-primary text-right mb-6 drop-shadow-sm" dir="rtl">
                         {pulseData.personal_verse?.text_uthmani || "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا..."}
                      </p>
                      <h4 className="font-serif text-2xl text-primary mt-8 mb-2">
                         {pulseData.personal_verse?.chapter_name_english || "Al-Baqarah"} {pulseData.personal_verse?.verse_key}
                      </h4>
                      <p className="font-body text-lg text-on-surface-variant italic">
                         "{pulseData.personal_verse?.translation || "Allah does not burden a soul beyond that it can bear..."}"
                      </p>
                   </div>
                </div>

                {/* Trending List */}
                <div className="max-w-4xl mx-auto pt-12 space-y-10">
                   <div className="text-center space-y-4 mb-16">
                      <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl text-primary">{t('trendingWithUmmah', isoCode)}</h2>
                      <p className="font-label text-xs tracking-[0.2em] uppercase text-on-surface-variant font-bold">{t('collectiveEchoes', isoCode)}</p>
                   </div>

                   <div className="space-y-6">
                      {pulseData.trending?.map((item: any, idx: number) => (
                         <div key={idx} className="group relative bg-surface-container-low hover:bg-surface-container-highest rounded-3xl p-8 md:p-10 border border-outline-variant/10 hover:border-primary/20 transition-all duration-500 overflow-hidden text-center md:text-left">
                            <div className="flex flex-col md:flex-row gap-8 md:items-center">
                               {/* Ranking / Icon */}
                               <div className="shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-primary/5 text-primary/40 font-serif text-2xl mx-auto md:mx-0">
                                 {idx + 1}
                               </div>

                               {/* Verse & Theme Details */}
                               <div className="flex-1 space-y-3">
                                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-2">
                                     <h4 className="font-serif text-2xl text-primary">
                                        {item.meta?.chapter_name_english || "Surah"} {item.meta?.verse_key || item.verse_key}
                                     </h4>
                                     <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full font-label text-[10px] tracking-widest uppercase border border-secondary/20">
                                        {item.theme}
                                     </span>
                                  </div>
                                  <p className="font-arabic text-2xl leading-loose text-primary text-center md:text-right" dir="rtl">
                                     {item.meta?.text_uthmani || "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ"}
                                  </p>
                                  <p className="font-body text-base text-on-surface-variant italic">
                                     "{item.meta?.translation || "Your Lord has not forsaken you, nor does He hate you."}"
                                  </p>
                               </div>
                            </div>
                            
                            {/* Reflection Snippet */}
                            <div className="mt-8 pt-6 border-t border-outline-variant/5">
                               <p className="font-body text-sm leading-relaxed text-on-surface/80 flex items-start gap-3">
                                  <Users className="w-5 h-5 text-primary/30 shrink-0 mt-0.5" />
                                  <span dangerouslySetInnerHTML={{ __html: item.reflection_snippet }} />
                               </p>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
