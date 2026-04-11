'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, X, BookOpen, Mic, Sparkles, Star, Calendar, ArrowRight, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    verseKey?: string;
    categories?: string[];
    voiceTranscript?: string | null;
    date?: string;
  } | null;
  date: Date;
}
interface HistoryClientProps {
  notes: ParsedNote[];
}

export function HistoryClient({ notes }: HistoryClientProps) {
  const [search, setSearch] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ParsedNote | null>(null);

  const filtered = useMemo(() => {
    return notes.filter((note) => {
      const matchSearch =
        !search ||
        note.logText.toLowerCase().includes(search.toLowerCase()) ||
        (note.metadata?.verseKey || '').includes(search);
      const matchCats =
        selectedCats.length === 0 ||
        selectedCats.every((cat) =>
          (note.metadata?.categories || []).includes(cat)
        );
      return matchSearch && matchCats;
    });
  }, [notes, search, selectedCats]);

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
              : 'bg-white border-outline-variant/10 text-on-surface-variant hover:border-primary/30'
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
          className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white border border-outline-variant/10 text-lg font-body outline-none focus:border-primary/30 transition-all placeholder:italic placeholder:text-on-surface-variant/30 editorial-shadow"
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
                          : 'bg-white border-outline-variant/10 text-on-surface-variant hover:border-primary/30'
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
              const formattedDate = note.date.toLocaleDateString('en-US', {
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
                        {note.date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="font-serif text-lg text-primary">{formattedDate}</span>
                    </div>
                    <div className={`hidden md:block h-px flex-1 bg-gradient-to-r ${isEven ? 'from-primary/20 to-transparent' : 'from-transparent to-primary/20'}`} />
                  </div>

                  {/* Card View */}
                   <div className="md:w-1/2 w-full">
                    <button
                      onClick={() => setSelectedNote(note)}
                      className="w-full text-left bg-white rounded-3xl p-8 border border-outline-variant/10 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5 text-primary" />
                      </div>
                      
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center text-[10px] font-bold">
                          {note.metadata?.verseKey || '—'}
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
                        <h2 className="font-serif text-3xl text-primary">{selectedNote.metadata?.verseKey || 'Source Citation'}</h2>
                        <div className="flex items-center gap-2 text-on-surface-variant/70">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="font-label text-[10px] tracking-widest uppercase">
                            {selectedNote.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedNote(null)}
                  className="w-12 h-12 rounded-full border border-outline-variant/10 flex items-center justify-center text-on-surface-variant hover:bg-white transition-all"
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
                  <div className="p-1 w-full bg-gradient-to-b from-primary/10 to-transparent rounded-2xl mb-8 opacity-40" />
                  <p className="font-body text-xl md:text-2xl text-on-surface leading-loose italic relative z-10">
                    &ldquo;{selectedNote.logText}&rdquo;
                  </p>
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
