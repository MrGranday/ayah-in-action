'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, X, BookOpen, Mic, Sparkles, Star, Calendar, ArrowRight, Quote, ChevronDown, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIES = [
  'Patience', 'Gratitude', 'Family', 'Work', 'Anger',
  'Honesty', 'Kindness', 'Reflection', 'Sabr', 'Tawakkul',
];

interface Note {
  id: string;
  body: string;
  createdAt: string;
}
interface ParsedNote {
  id: string;
  logText: string;
  metadata: {
    verse_key?: string;
    verseKey?: string;
    categories?: string[];
    voiceTranscript?: string | null;
    date?: string;
    type?: 'journal' | 'whisper';
    challenge?: string;
    // Whisper specific
    arabic?: string;
    translation?: string;
    guidance?: string;
    reflection?: string;
    // Echo of Application
    echo?: string | null;
  } | null;
  // ISO string — Date objects cannot cross the RSC Server→Client boundary (React #130)
  date: string;
  ayahTextArabic?: string | null;
  ayahTextTranslation?: string | null;
}
interface HistoryClientProps {
  notes: ParsedNote[];
}

function HeirloomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: { label: string; value: string }[];
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  const openDropdown = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = Math.min(options.length * 48 + 16, 260);
      const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      setDropdownStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
        ...(showAbove
          ? { bottom: window.innerHeight - rect.top + 6 }
          : { top: rect.bottom + 6 }),
      });
    }
    setIsOpen(true);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => (isOpen ? setIsOpen(false) : openDropdown())}
        className="w-full h-12 rounded-xl bg-surface-container-high border border-outline-variant/20 px-4 flex items-center justify-between font-body text-sm text-on-surface hover:bg-surface-container-highest transition-all focus:ring-2 focus:ring-primary/5 outline-none"
      >
        <span className={value === 'all' ? 'text-on-surface-variant/60' : 'text-on-surface'}>
          {selectedLabel}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-primary/30 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Full-screen backdrop to catch outside clicks */}
            <div 
              className="fixed inset-0"
              style={{ zIndex: 9998 }}
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              style={dropdownStyle}
              className="bg-surface-container-highest rounded-2xl border border-outline-variant/10 editorial-shadow parchment-texture overflow-hidden"
            >
              <div className="max-h-64 overflow-y-auto py-2">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm font-body transition-colors hover:bg-primary/10",
                      value === opt.value ? "text-primary font-bold bg-primary/5" : "text-on-surface"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HistoryClient({ notes }: HistoryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ParsedNote | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'journal' | 'whisper'>('all');
  
  // URL-driven filters
  const selectedMonth = searchParams.get('month') || 'all';
  const selectedYear = searchParams.get('year') || 'all';
  const currentLimit = parseInt(searchParams.get('limit') || '20');

  const updateParams = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === 'all' || value === null) params.delete(key);
      else params.set(key, value);
    });
    router.push(`/history?${params.toString()}`, { scroll: false });
  };

  const filtered = useMemo(() => {
    return notes.filter((note) => {
      const matchSearch =
        !search ||
        note.logText.toLowerCase().includes(search.toLowerCase()) ||
        (note.metadata?.verse_key || note.metadata?.verseKey || '').includes(search);
      const matchCats =
        selectedCats.length === 0 ||
        selectedCats.every((cat) =>
          (note.metadata?.categories || []).includes(cat)
        );
      const matchType = filterType === 'all' || (note.metadata?.type || 'journal') === filterType;
      
      const noteDate = new Date(note.date);
      const matchMonth = selectedMonth === 'all' || (noteDate.getMonth() + 1).toString() === selectedMonth;
      const matchYear = selectedYear === 'all' || noteDate.getFullYear().toString() === selectedYear;

      return matchSearch && matchCats && matchType && matchMonth && matchYear;
    });
  }, [notes, search, selectedCats, filterType, selectedMonth, selectedYear]);

  const toggleCat = (cat: string) => {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };
  const clearFilters = () => { setSearch(''); setSelectedCats([]); };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* ── Header Area ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="font-label text-[10px] tracking-[0.4em] uppercase text-primary/60 block mb-4">
            Personal Narrative
          </span>
          <h1 className="font-serif text-5xl text-primary">The Archive</h1>
          <p className="font-body text-on-surface-variant italic mt-2">
            {notes.length} sacred moment{notes.length !== 1 ? 's' : ''} preserved.
          </p>
        </div>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-label text-[10px] tracking-widest uppercase transition-all duration-500 border ${
            showFilters 
              ? 'silk-gradient text-white border-transparent editorial-shadow' 
              : 'bg-surface-container-lowest border-outline-variant/10 text-on-surface-variant hover:border-primary/30'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filter Archive
          {selectedCats.length > 0 && (
            <span className="ml-2 w-5 h-5 rounded-full bg-white text-primary flex items-center justify-center font-bold">
              {selectedCats.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Search Bar ─────────────────────────────────────────────── */}
      <div className="relative group">
        <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder="Search reflections, citations, or virtues..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-14 pr-6 py-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 text-lg font-body outline-none focus:border-primary/30 transition-all placeholder:italic placeholder:text-on-surface-variant/30 editorial-shadow"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Filter Drawer ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/5 parchment-texture">
              <div className="flex items-center justify-between mb-6">
                <span className="font-label text-xs tracking-widest uppercase text-on-surface-variant">Filter by Source</span>
                <div className="flex gap-2">
                   {(['all', 'journal', 'whisper'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setFilterType(t)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-bold tracking-widest uppercase transition-all ${
                          filterType === t 
                            ? 'bg-primary text-white' 
                            : 'bg-surface-container-highest text-on-surface-variant/60 hover:text-primary'
                        }`}
                      >
                        {t}
                      </button>
                   ))}
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8 pt-4 border-t border-outline-variant/5">
                <div className="space-y-4">
                  <span className="font-label text-xs tracking-widest uppercase text-on-surface-variant">Archival Month</span>
                  <HeirloomSelect 
                    value={selectedMonth}
                    placeholder="All Months"
                    onChange={(val) => updateParams({ month: val })}
                    options={[
                      { label: 'All Months', value: 'all' },
                      ...['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => ({
                        label: m,
                        value: (i + 1).toString()
                      }))
                    ]}
                  />
                </div>
                <div className="space-y-4">
                  <span className="font-label text-xs tracking-widest uppercase text-on-surface-variant">Year</span>
                  <HeirloomSelect 
                    value={selectedYear}
                    placeholder="Any Year"
                    onChange={(val) => updateParams({ year: val })}
                    options={[
                      { label: 'Any Year', value: 'all' },
                      ...[2024, 2025, 2026].map(y => ({
                        label: y.toString(),
                        value: y.toString()
                      }))
                    ]}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <span className="font-label text-xs tracking-widest uppercase text-on-surface-variant">Filter by Virtue</span>
                {selectedCats.length > 0 && (
                  <button onClick={clearFilters} className="text-[10px] font-bold tracking-widest uppercase text-primary hover:underline">
                    Clear Selection
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {CATEGORIES.map((cat) => {
                  const active = selectedCats.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCat(cat)}
                      className={`px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all duration-300 border ${
                        active 
                          ? 'silk-gradient text-white border-transparent' 
                          : 'bg-surface-container-lowest border-outline-variant/10 text-on-surface-variant hover:border-primary/30'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Entry Timeline ─────────────────────────────────────────── */}
      <div className="relative">
        {/* The center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-primary/5 to-transparent hidden md:block" />

        {filtered.length === 0 ? (
          <div className="text-center py-24 bg-surface-container-low rounded-[3rem] border border-outline-variant/5 parchment-texture">
            <BookOpen className="w-12 h-12 mx-auto mb-6 text-primary/20" />
            <p className="font-serif italic text-xl text-on-surface-variant">The archive remains silent for these criteria.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {filtered.map((note, index) => {
              const noteDate = new Date(note.date); // parse ISO string client-side
              const formattedDate = noteDate.toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              });
              const isEven = index % 2 === 0;
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`flex flex-col md:flex-row gap-8 items-center ${isEven ? 'md:flex-row-reverse' : ''}`}
                >
                  {/* Date Pillar */}
                  <div className="md:w-1/2 flex justify-center md:justify-start items-center gap-4">
                    <div className={`hidden md:block h-px flex-1 bg-gradient-to-r ${isEven ? 'from-transparent to-primary/20' : 'from-primary/20 to-transparent'}`} />
                    <div className="text-center px-6">
                      <span className="font-label text-[10px] tracking-[0.3em] uppercase text-primary/40 block mb-1">
                        {noteDate.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="font-serif text-lg text-primary">{formattedDate}</span>
                    </div>
                    <div className={`hidden md:block h-px flex-1 bg-gradient-to-r ${isEven ? 'from-primary/20 to-transparent' : 'from-transparent to-primary/20'}`} />
                  </div>

                  {/* Card View */}
                   <div className="md:w-1/2 w-full">
                    <button
                      onClick={() => setSelectedNote(note)}
                      className={cn(
                        "w-full text-left bg-surface-container-lowest rounded-3xl p-8 border transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group relative overflow-hidden",
                        note.metadata?.type === 'whisper' ? "border-tertiary/30 bg-tertiary-fixed/5" : "border-outline-variant/10"
                      )}
                    >
                      {note.metadata?.type === 'whisper' && (
                        <div className="absolute top-4 right-4 text-tertiary">
                           <Sparkles className="w-4 h-4 animate-pulse" />
                        </div>
                      )}
                      
                      <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5 text-primary" />
                      </div>
                      
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center text-[10px] font-bold">
                          {note.metadata?.verse_key || note.metadata?.verseKey || '—'}
                        </div>
                        <div className="flex gap-1.5">
                           {(note.metadata?.categories || []).slice(0, 2).map((cat) => (
                              <span key={cat} className="text-[8px] font-bold uppercase tracking-widest text-primary/60 border border-primary/10 px-2 py-0.5 rounded-full">
                                {cat}
                              </span>
                           ))}
                        </div>
                      </div>

                      <p className="font-body text-on-surface line-clamp-3 leading-relaxed italic mb-4">
                        &ldquo;{note.logText}&rdquo;
                      </p>

                      {/* Echo of Application */}
                      {note.metadata?.echo && (
                        <div className="mt-3 mb-2 flex items-start gap-2 bg-primary/5 rounded-xl px-3 py-2.5 border border-primary/10">
                          <Sparkles className="w-3 h-3 text-primary/50 mt-0.5 shrink-0" />
                          <p className="font-serif text-[11px] text-primary/70 italic leading-snug line-clamp-2">
                            {note.metadata.echo}
                          </p>
                        </div>
                      )}

                      {note.metadata?.voiceTranscript && (
                        <div className="flex items-center gap-2 text-primary/60">
                          <Mic className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest italic">Recorded Session</span>
                        </div>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {/* Load More Button */}
            <div className="flex justify-center pt-16">
               <button
                 onClick={() => updateParams({ limit: (currentLimit + 20).toString() })}
                 className="group flex flex-col items-center gap-4 transition-all"
               >
                 <div className="w-14 h-14 rounded-full border-2 border-dashed border-outline-variant/40 flex items-center justify-center text-primary/40 group-hover:border-primary group-hover:text-primary transition-all duration-500">
                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                 </div>
                 <span className="font-label text-[10px] tracking-[0.3em] uppercase text-primary/40 font-bold group-hover:text-primary transition-colors">
                   Load Older Archives
                 </span>
               </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Archive Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {selectedNote && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNote(null)}
              className="absolute inset-0 bg-primary/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="relative w-full max-w-2xl bg-surface rounded-[3rem] overflow-hidden editorial-shadow parchment-texture flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 md:p-12 pb-6 flex items-start justify-between">
                <div>
                   <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full silk-gradient flex items-center justify-center text-white editorial-shadow">
                        <Star className="w-6 h-6 fill-current" />
                      </div>
                      <div>
                        <h2 className="font-serif text-3xl text-primary">{selectedNote.metadata?.verse_key || selectedNote.metadata?.verseKey || 'Source Citation'}</h2>
                        <div className="flex items-center gap-2 text-on-surface-variant/70">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="font-label text-[10px] tracking-widest uppercase">
                            {new Date(selectedNote.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedNote(null)}
                  className="w-12 h-12 rounded-full border border-outline-variant/10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-lowest transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto px-8 md:px-12 pb-12 space-y-10">
                <div className="relative">
                  <span className="absolute -top-6 -left-4 text-primary/5 select-none opacity-50">
                    <Quote className="w-24 h-24 fill-current" />
                  </span>
                  
                  {selectedNote.ayahTextArabic && (
                    <div className="mb-10 text-center space-y-4 px-4 bg-primary/5 py-8 rounded-3xl border border-primary/10 relative z-10">
                      <p className="font-arabic text-3xl leading-[2.5] text-primary" dir="rtl">
                        {selectedNote.ayahTextArabic}
                      </p>
                      {selectedNote.ayahTextTranslation && (
                        <p className="font-body text-sm text-on-surface-variant italic leading-relaxed max-w-xl mx-auto">
                          {selectedNote.ayahTextTranslation}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="p-1 w-full bg-gradient-to-b from-primary/10 to-transparent rounded-2xl mb-8 opacity-40" />
                  
                  <span className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase mb-4 block relative z-10">
                    {selectedNote.metadata?.type === 'whisper' ? 'Spiritual Insight' : 'Preserved Insight'}
                  </span>

                  {selectedNote.metadata?.type === 'whisper' ? (
                    <div className="space-y-8 relative z-10">
                       <div className="space-y-4">
                          <h5 className="font-label text-[10px] tracking-[0.3em] uppercase text-primary font-bold px-1 border-l-2 border-primary/20">The Gaze</h5>
                          <p className="font-body text-base text-on-surface/80 leading-relaxed italic">
                             {selectedNote.metadata.guidance || selectedNote.logText.split(' | ')[0]}
                          </p>
                       </div>
                       <div className="space-y-4">
                          <h5 className="font-label text-[10px] tracking-[0.3em] uppercase text-secondary font-bold px-1 border-l-2 border-secondary/40">The Manifestation</h5>
                          <p className="font-body text-base text-on-surface-variant leading-relaxed">
                             {selectedNote.metadata.reflection || selectedNote.logText.split(' | ')[1]}
                          </p>
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="font-body text-xl md:text-2xl text-on-surface leading-loose italic relative z-10 pl-4 border-l-2 border-primary/20">
                        &ldquo;{selectedNote.logText}&rdquo;
                      </p>
                      {selectedNote.metadata?.echo && (
                        <div className="flex items-start gap-3 bg-primary/5 rounded-2xl px-5 py-4 border border-primary/10">
                          <Sparkles className="w-4 h-4 text-primary/50 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-label text-[9px] tracking-[0.2em] uppercase text-primary/40 block mb-1">Echo of Transformation</span>
                            <p className="font-serif text-base text-primary italic leading-relaxed">
                              &ldquo;{selectedNote.metadata.echo}&rdquo;
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-outline-variant/10">
                  <div>
                    <span className="font-label text-[10px] tracking-widest uppercase text-on-surface-variant/60 block mb-4">Manifested Virtues</span>
                    <div className="flex flex-wrap gap-2">
                       {(selectedNote.metadata?.categories || []).map((cat) => (
                          <span key={cat} className="px-4 py-1.5 border border-primary/20 rounded-full text-[10px] font-bold tracking-widest uppercase text-primary bg-primary/5">
                            {cat}
                          </span>
                       ))}
                    </div>
                  </div>

                  {selectedNote.metadata?.voiceTranscript && (
                    <div>
                      <span className="font-label text-[10px] tracking-widest uppercase text-on-surface-variant/60 block mb-4">Voice Archive Data</span>
                      <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/5">
                        <div className="flex items-center gap-3 mb-3 text-primary">
                          <Mic className="w-4 h-4" />
                          <span className="font-label text-[9px] tracking-widest uppercase font-bold text-primary/80">Transcript Fragment</span>
                        </div>
                        <p className="text-sm italic leading-relaxed text-on-surface-variant/80">
                          {selectedNote.metadata.voiceTranscript}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Overlay Pattern */}
              <div className="h-6 bg-gradient-to-l from-primary/10 via-tertiary-fixed/30 to-primary/10 opacity-20" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
