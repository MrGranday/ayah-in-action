'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

import { useTheme } from 'next-themes';
import { isAyahInActionNote, parseNoteBody } from '@/lib/utils';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { t } from '@/lib/i18n/uiStrings';
import { formatNumber } from '@/config/languageConfig';

interface Note {
  id: string;
  body: string;
  createdAt?: string;
  created_at?: string;
}

interface ImpactStatsProps {
  notes: Note[];
}

export function ImpactStats({ notes }: ImpactStatsProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const isoCode = useLanguageStore((state) => state.activeIsoCode);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const appNotes = notes.filter(n => isAyahInActionNote(n));

  const categoryCount: Record<string, number> = {};
  const weeklyData: Record<string, number> = {};

  appNotes.forEach(note => {
    const { metadata } = parseNoteBody(note.body);
    if (metadata && metadata.categories) {
      metadata.categories.forEach((cat: string) => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
    }

    const noteDate = new Date(note.createdAt || note.created_at || 0);
    const weekStart = new Date(noteDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toLocaleDateString('en-CA');
    weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
  });

  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const heirloomColors = isDark 
    ? ['#a3f2d6', '#e6c16d', '#ffcc80', '#56d6b1', '#d4a017']
    : ['#004c3b', '#d4a017', '#8b5c16', '#006b54', '#a67c00'];

  const doughnutData = {
    labels: topCategories.map(([cat]) => t(`cat${cat}` as any, isoCode)),
    datasets: [
      {
        data: topCategories.map(([, count]) => count),
        backgroundColor: heirloomColors,
        hoverBackgroundColor: heirloomColors.map(c => c + 'dd'),
        borderWidth: 0,
        borderRadius: 8,
        spacing: 4,
      },
    ],
  };

  // Generate fixed buckets for the last 6 weeks
  const today = new Date();
  const last6WeeksLabels: string[] = [];
  const last6WeeksCounts: number[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - (d.getDay()) - (i * 7)); // Start of week (Sunday)
    const weekKey = d.toLocaleDateString('en-CA');
    last6WeeksLabels.push(d.toLocaleDateString(isoCode, { month: 'short', day: 'numeric' }));
    last6WeeksCounts.push(weeklyData[weekKey] || 0);
  }

  const barData = {
    labels: last6WeeksLabels,
    datasets: [
      {
        label: t('archiveTitle', isoCode),
        data: last6WeeksCounts,
        backgroundColor: isDark ? '#a3f2d6' : '#004c3b',
        borderRadius: 12,
        barThickness: 24,
      },
    ],
  };

  const themeTextColor = isDark ? '#bec9c3' : '#004c3b80';
  const themeTooltipBg = isDark ? '#30312c' : '#fafaf3';
  const themeTooltipText = isDark ? '#e3e3dc' : '#004c3b';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            family: "'Inter', sans-serif",
            size: 10,
            weight: 'bold' as any,
          },
          color: themeTextColor,
        },
      },
      tooltip: {
        backgroundColor: themeTooltipBg,
        titleColor: themeTooltipText,
        bodyColor: themeTooltipText,
        borderColor: isDark ? '#a3f2d620' : '#004c3b10',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        titleFont: { family: "'Newsreader', serif", size: 14 },
        bodyFont: { family: "'Inter', sans-serif", size: 12 },
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10 editorial-shadow parchment-texture">
        <span className="font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant font-bold mb-4 block">
          {t('virtueDistribution', isoCode)}
        </span>
        <h3 className="font-serif text-lg text-primary mb-6">{t('dominantMoralThemes', isoCode)}</h3>
        <div className="h-60">
          {topCategories.length > 0 ? (
            <Doughnut
              data={doughnutData}
              options={chartOptions}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/40 space-y-4">
              <div className="w-12 h-12 rounded-full border border-dashed border-outline-variant/30" />
              <p className="font-body italic">{t('legacySecure', isoCode)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/10 editorial-shadow parchment-texture">
        <span className="font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant font-bold mb-4 block">
          {t('activityVelocity', isoCode)}
        </span>
        <h3 className="font-serif text-lg text-primary mb-6">{t('weeklyTranscendence', isoCode)}</h3>
        <div className="h-60">
          {last6WeeksLabels.length > 0 ? (
            <Bar
              data={barData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                      stepSize: 1,
                      font: { family: "'Inter', sans-serif", size: 10 },
                      color: themeTextColor,
                      callback: (val: any) => formatNumber(val, isoCode)
                    },
                  },
                  x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                      font: { family: "'Inter', sans-serif", size: 10 },
                      color: themeTextColor,
                    },
                  },
                },
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/40 space-y-4">
              <div className="w-12 h-12 rounded-full border border-dashed border-outline-variant/30" />
              <p className="font-body italic">{t('legacySecure', isoCode)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
