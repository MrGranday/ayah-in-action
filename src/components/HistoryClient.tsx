'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, X, BookOpen, Mic, ChevronDown } from 'lucide-react';

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
    voiceTranscript?: string;
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>My Journal</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {notes.length} reflection{notes.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:shadow-md"
          style={{
            background: showFilters ? 'var(--color-emerald)' : 'var(--color-surface)',
            color: showFilters ? '#fff' : 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Filter className="w-4 h-4" />
          Filters
          {(selectedCats.length > 0) && (
            <span
              className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
              style={{ background: '#fff', color: 'var(--color-emerald)' }}
            >
              {selectedCats.length}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: 'var(--color-text-muted)' }}
        />
        <input
          type="text"
          placeholder="Search reflections, verses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none transition-all"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--color-emerald)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category filter chips */}
      {showFilters && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Filter by Category
            </span>
            {selectedCats.length > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium hover:underline"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = selectedCats.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCat(cat)}
                  className="tag-chip px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={{
                    background: active ? 'var(--color-emerald)' : 'var(--color-parchment)',
                    color: active ? '#fff' : 'var(--color-text-muted)',
                    borderColor: active ? 'var(--color-emerald)' : 'var(--color-border)',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active filters summary */}
      {(search || selectedCats.length > 0) && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <span>
            Showing <strong style={{ color: 'var(--color-text-primary)' }}>{filtered.length}</strong> of{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{notes.length}</strong> entries
          </span>
          <button onClick={clearFilters} className="hover:underline" style={{ color: 'var(--color-emerald)' }}>
            Clear
          </button>
        </div>
      )}

      {/* Entry list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
          <BookOpen className="w-10 h-10 mx-auto mb-4 opacity-30" />
          <p className="italic">No reflections match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((note) => {
            const formattedDate = note.date.toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
            });
            const hasVoice = !!note.metadata?.voiceTranscript;
            return (
              <button
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className="w-full text-left rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg group"
                style={{
                  background: 'var(--color-parchment)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'inset 0 0 40px rgba(138,77,15,0.04)',
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(212,160,23,0.15)', color: 'var(--color-gold)' }}
                    >
                      {note.metadata?.verseKey || '—'}
                    </span>
                    {hasVoice && (
                      <span
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase"
                        style={{ background: 'rgba(10,102,80,0.08)', color: 'var(--color-emerald)' }}
                      >
                        <Mic className="w-3 h-3" /> Voice
                      </span>
                    )}
                  </div>
                  <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                    {formattedDate}
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed line-clamp-2 mb-3"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {note.logText}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(note.metadata?.categories || []).map((cat) => (
                    <span
                      key={cat}
                      className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(10,102,80,0.08)', color: 'var(--color-emerald)' }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Detail Modal ─────────────────────────────────────────────── */}
      {selectedNote && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setSelectedNote(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 space-y-6 modal-enter"
            style={{
              background: 'var(--color-parchment)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.2)',
            }}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span
                  className="px-3 py-1 rounded-full text-sm font-bold"
                  style={{ background: 'rgba(212,160,23,0.15)', color: 'var(--color-gold)' }}
                >
                  {selectedNote.metadata?.verseKey || 'Unknown Verse'}
                </span>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {selectedNote.date.toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedNote(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-black/10"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Log text */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: 'var(--color-surface)',
                borderLeft: '3px solid var(--color-emerald)',
              }}
            >
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-emerald)' }}>
                My Reflection
              </p>
              <p className="leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                {selectedNote.logText}
              </p>
            </div>

            {/* Categories */}
            {(selectedNote.metadata?.categories || []).length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                  Categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {(selectedNote.metadata?.categories || []).map((cat) => (
                    <span
                      key={cat}
                      className="px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{ background: 'var(--color-emerald)', color: '#fff' }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Voice transcript */}
            {selectedNote.metadata?.voiceTranscript && (
              <div
                className="p-4 rounded-2xl"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Mic className="w-4 h-4" style={{ color: 'var(--color-emerald)' }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    Voice Note Transcript
                  </p>
                </div>
                <p className="text-sm italic leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                  {selectedNote.metadata.voiceTranscript}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .modal-enter {
          animation: modalReveal 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        @keyframes modalReveal {
          from { opacity: 0; transform: scale(0.96) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
