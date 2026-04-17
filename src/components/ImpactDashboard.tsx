'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Trophy, Sparkles, Star, Target, BookOpen } from 'lucide-react';
import { StreakHeatmap } from './StreakHeatmap';
import { ImpactStats } from './ImpactStats';
import { EchoTimeline } from './EchoTimeline';
import { useAuthStore } from '@/stores/useAuthStore';
import { EmptyState } from './EmptyState';
import { computeAppStreak, parseNoteBody, isAyahInActionNote } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Note {
  id: string;
  body: string;
  createdAt?: string;
  created_at?: string;
}

interface ImpactDashboardProps {
  notes: Note[];
  /** Pre-computed heatmap values merging AIA notes + QF activity days (two-way sync). */
  heatmapValues?: Array<{ date: string; count: number }>;
}

export function ImpactDashboard({ notes, heatmapValues: heatmapValuesProp }: ImpactDashboardProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalLogs: 0,
    currentStreak: 0,
    longestStreak: 0,
    topCategory: '',
    monthlyLogs: 0,
  });

  useEffect(() => {
    const appNotes = notes.filter(n => isAyahInActionNote(n));
    const streak = computeAppStreak(notes);
    
    const categoryCount: Record<string, number> = {};
    const dateCount: Record<string, number> = {};
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    appNotes.forEach(note => {
      const { metadata } = parseNoteBody(note.body);
      if (metadata && metadata.categories) {
        (metadata.categories as string[]).forEach(cat => {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
      }
      
      const noteDate = new Date(note.createdAt || note.created_at || 0);
      if (noteDate.getTime() > 0 && noteDate >= startOfMonth) {
        const dateKey = noteDate.toLocaleDateString('en-CA');
        dateCount[dateKey] = (dateCount[dateKey] || 0) + 1;
      }
    });
    
    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    
    const sortedDates = [...new Set(appNotes.map(n => new Date(n.createdAt || n.created_at || 0).toLocaleDateString('en-CA')))].sort().reverse();
    let longestStreak = 0;
    
    if (sortedDates.length > 0) {
      const today = new Date().toLocaleDateString('en-CA');
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
      
      if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        for (let i = 1; i < sortedDates.length; i++) {
          const prev = new Date(sortedDates[i - 1]);
          const curr = new Date(sortedDates[i]);
          const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
          if (diff !== 1) break;
        }
      }
      
      let tempStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
        if (diff === 1) tempStreak++;
        else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }
    
    setStats({
      totalLogs: appNotes.length,
      currentStreak: streak,
      longestStreak: Math.max(longestStreak, streak),
      topCategory,
      monthlyLogs: Object.keys(dateCount).length,
    });
  }, [notes]);

  // Use server-provided heatmap (which includes QF activity days for two-way sync)
  // Fall back to deriving from AIA notes only if prop not provided
  const heatmapValues = heatmapValuesProp ?? notes
    .filter(n => isAyahInActionNote(n))
    .reduce((acc: { date: string; count: number }[], note) => {
      const date = new Date(note.createdAt || note.created_at || 0).toLocaleDateString('en-CA');
      const existing = acc.find(x => x.date === date);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ date, count: 1 });
      }
      return acc;
    }, []);

  const appNotesCount = notes.filter(n => isAyahInActionNote(n)).length;

  if (appNotesCount === 0) {
    return (
      <div className="bg-surface-container-low rounded-[3rem] p-16 md:p-24 border border-outline-variant/10 text-center parchment-texture">
        <EmptyState 
          title="The Archive Awaits Your Legacy" 
          description="Your spiritual growth and consistency will be visualized here as you begin preserving your daily reflections."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* ── Header ── */}
      <div className="text-center space-y-1">
        <span className="font-label text-[9px] tracking-[0.4em] uppercase text-primary/60 block">Spiritual Momentum</span>
        <h1 className="font-serif text-2xl md:text-3xl text-primary">The Influence of Wisdom</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Streak Main Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-surface-container-low rounded-2xl p-6 border border-outline-variant/10 editorial-shadow parchment-texture relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 text-primary/5">
             <Flame className="w-16 h-16 stroke-[1px]" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full silk-gradient flex items-center justify-center text-white editorial-shadow">
                <Flame className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h2 className="font-serif text-2xl text-primary">
                  {stats.currentStreak} Day Streak
                </h2>
                <p className="font-body text-xs text-on-surface-variant italic">
                  Consistent reflection builds the character of the believer.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="font-label text-[9px] tracking-widest uppercase text-on-surface-variant font-bold">Monthly Commitment</span>
                <span className="font-serif text-lg text-primary">{stats.monthlyLogs} <span className="text-sm text-on-surface-variant/50">/ 60</span></span>
              </div>
              <div className="w-full bg-surface-container-highest/50 border border-outline-variant/10 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((stats.monthlyLogs / 60) * 100, 100)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="silk-gradient h-full rounded-full"
                />
              </div>
              <p className="text-[10px] font-label tracking-widest uppercase text-on-surface-variant/40 italic">
                {stats.monthlyLogs >= 60 ? 'MashaAllah, you have reached your monthly pinnacle.' : `Maintain your pace to reach the goal of 60 reflections.`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Small Stats Grid */}
        <div className="grid gap-6">
          {[
            { label: 'Total Legacy', value: stats.totalLogs, icon: <BookOpen className="w-4 h-4" />, color: 'bg-primary/5 text-primary' },
            { label: 'Prime Virtue', value: stats.topCategory, icon: <Trophy className="w-4 h-4" />, color: 'bg-gold/10 text-gold' },
            { label: 'Peak Consistency', value: `${stats.longestStreak} Days`, icon: <Star className="w-4 h-4" />, color: 'bg-tertiary-fixed text-on-tertiary-fixed' },
          ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/10 editorial-shadow flex flex-col justify-between h-full"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-label text-[8px] tracking-[0.2em] uppercase text-on-surface-variant font-bold">{item.label}</span>
                  <div className={`p-1.5 rounded-lg ${item.color}`}>
                    {item.icon}
                  </div>
                </div>
                <div className="font-serif text-xl text-on-surface truncate">
                  {String(item.value)}
                </div>
              </motion.div>
          ))}
        </div>
      </div>

      {/* Heatmap Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-surface-container-low rounded-2xl p-6 md:p-10 border border-outline-variant/10 editorial-shadow parchment-texture"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="text-primary w-4 h-4" />
            <h3 className="font-serif text-xl text-primary">The Tapestry of Action</h3>
          </div>
          <span className="font-label text-[9px] tracking-widest uppercase text-on-surface-variant/40">Past 52 Weeks</span>
        </div>
        <StreakHeatmap values={heatmapValues} />
      </motion.div>

      {/* Impact Stats Detail */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <ImpactStats notes={notes} />
      </motion.div>

      {/* ── Echoes of Transformation ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-surface-container-low rounded-2xl border border-outline-variant/10 editorial-shadow parchment-texture overflow-hidden"
      >
        <div className="p-6 md:p-8 border-b border-outline-variant/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl silk-gradient flex items-center justify-center editorial-shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-serif text-xl text-primary">Echoes of Transformation</h3>
              <p className="font-body text-[11px] text-on-surface-variant/60 italic">
                Poetic reflections woven from your real-life applications of the Quran
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 md:p-8">
          <EchoTimeline notes={notes} />
        </div>
      </motion.div>
    </div>
  );
}
