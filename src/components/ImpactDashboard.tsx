'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flame, Tag, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StreakHeatmap } from './StreakHeatmap';
import { ImpactStats } from './ImpactStats';
import { useAuthStore } from '@/stores/useAuthStore';
import { EmptyState } from './EmptyState';
import { computeAppStreak, parseNoteBody, isAyahInActionNote } from '@/lib/utils';

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
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <div className="parchment p-12">
        <EmptyState 
          title="Start logging to see your journey take shape." 
          description="Your impact, streaks, and reflections will appear here as soon as you record your first action."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="parchment p-6">
        <div className="flex items-center gap-3 mb-2">
          <Flame className="w-8 h-8 text-gold" />
          <div>
            <h2 className="text-2xl font-semibold">
              {stats.currentStreak} day{stats.currentStreak !== 1 ? 's' : ''} streak
            </h2>
            <p className="text-text-muted">
              You&apos;ve applied the Quran {stats.monthlyLogs} times this month
            </p>
          </div>
        </div>
        <div className="w-full bg-surface rounded-full h-2 mt-4">
          <div
            className="bg-emerald h-2 rounded-full transition-all"
            style={{ width: `${Math.min((stats.monthlyLogs / 60) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-text-muted mt-1">{stats.monthlyLogs}/60 monthly goal</p>
      </div>

      <div className="parchment p-6">
        <h3 className="text-lg font-semibold mb-4">Activity Heatmap</h3>
        <StreakHeatmap values={heatmapValues} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Tag className="h-4 w-4 text-text-muted" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <Trophy className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topCategory}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
            <Flame className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.longestStreak} days</div>
          </CardContent>
        </Card>
      </div>

      <ImpactStats notes={notes} />
    </div>
  );
}
