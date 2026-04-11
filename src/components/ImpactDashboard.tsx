'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Tag, Trophy, Sparkles, Star, Target, BookOpen } from 'lucide-react';
import { StreakHeatmap } from './StreakHeatmap';
import { ImpactStats } from './ImpactStats';
import { useAuthStore } from '@/stores/useAuthStore';
import { EmptyState } from './EmptyState';
import { computeAppStreak, parseNoteBody, isAyahInActionNote } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Note {
  id: string;
  body: string;
  createdAt: string;
}

interface ImpactDashboardProps {
  notes: Note[];
}

export function ImpactDashboard({ notes }: ImpactDashboardProps) {
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
      
      const noteDate = new Date(note.createdAt);
      if (noteDate >= startOfMonth) {
        const dateKey = noteDate.toLocaleDateString('en-CA');
        dateCount[dateKey] = (dateCount[dateKey] || 0) + 1;
      }
    });
    
    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    
    const sortedDates = [...new Set(appNotes.map(n => new Date(n.createdAt).toLocaleDateString('en-CA')))].sort().reverse();
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

  const heatmapValues = notes
    .filter(n => isAyahInActionNote(n))
    .reduce((acc: { date: string; count: number }[], note) => {
      const date = new Date(note.createdAt).toLocaleDateString('en-CA');
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
    <div className="space-y-12 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="text-center space-y-4">
        <span className="font-label text-[10px] tracking-[0.4em] uppercase text-primary/60 block">Spiritual Momentum</span>
        <h1 className="font-serif text-5xl text-primary">The Influence of Wisdom</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Streak Main Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-surface-container-low rounded-[2rem] p-10 border border-outline-variant/10 editorial-shadow parchment-texture relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 text-primary/5">
             <Flame className="w-24 h-24 stroke-[1px]" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-full silk-gradient flex items-center justify-center text-white editorial-shadow">
                <Flame className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h2 className="font-serif text-4xl text-primary">
                  {stats.currentStreak} Day Streak
                </h2>
                <p className="font-body text-on-surface-variant italic">
                  Consistent reflection builds the character of the believer.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="font-label text-[10px] tracking-widest uppercase text-on-surface-variant font-bold">Monthly Commitment</span>
                <span className="font-serif text-xl text-primary">{stats.monthlyLogs} <span className="text-sm text-on-surface-variant/50">/ 60</span></span>
              </div>
              <div className="w-full bg-white/50 border border-outline-variant/10 rounded-full h-3 overflow-hidden">
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
              className="bg-white rounded-2xl p-6 border border-outline-variant/10 editorial-shadow flex flex-col justify-between h-full"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-label text-[9px] tracking-[0.2em] uppercase text-on-surface-variant font-bold">{item.label}</span>
                <div className={`p-2 rounded-lg ${item.color}`}>
                  {item.icon}
                </div>
              </div>
              <div className="font-serif text-2xl text-on-surface truncate">
                {item.value}
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
        className="bg-surface-container-low rounded-[2rem] p-10 border border-outline-variant/10 editorial-shadow parchment-texture"
      >
        <div className="flex items-center gap-3 mb-10">
          <Target className="text-primary w-5 h-5" />
          <h3 className="font-serif text-2xl text-primary">The Tapestry of Action</h3>
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
    </div>
  );
}
