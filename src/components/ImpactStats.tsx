'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface Note {
  body: string;
  createdAt: string;
}

interface ImpactStatsProps {
  notes: Note[];
}

export function ImpactStats({ notes }: ImpactStatsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const appNotes = notes.filter(n => n.body.includes('<!--aia'));

  const categoryCount: Record<string, number> = {};
  const weeklyData: Record<string, number> = {};

  appNotes.forEach(note => {
    const match = note.body.match(/<!--aia\n({.*?})\naia-->/s);
    if (match) {
      try {
        const metadata = JSON.parse(match[1]);
        if (metadata.categories) {
          metadata.categories.forEach((cat: string) => {
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;
          });
        }
      } catch {}
    }

    const noteDate = new Date(note.createdAt);
    const weekStart = new Date(noteDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toLocaleDateString('en-CA');
    weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
  });

  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const heirloomColors = [
    '#004c3b', // Primary
    '#d4a017', // Gold
    '#8b5c16', // Bronze
    '#006b54', // Emerald-ish
    '#a67c00', // Ochre
  ];

  const doughnutData = {
    labels: topCategories.map(([cat]) => cat),
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

  const sortedWeeks = Object.keys(weeklyData).sort().slice(-6);
  const barData = {
    labels: sortedWeeks.map(w => {
      const d = new Date(w);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Daily Reflections',
        data: sortedWeeks.map(w => weeklyData[w]),
        backgroundColor: '#004c3b',
        borderRadius: 12,
        barThickness: 24,
      },
    ],
  };

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
          color: '#004c3b80',
        },
      },
      tooltip: {
        backgroundColor: '#fafaf3',
        titleColor: '#004c3b',
        bodyColor: '#004c3b',
        borderColor: '#004c3b10',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        titleFont: { family: "'Newsreader', serif", size: 14 },
        bodyFont: { family: "'Inter', sans-serif", size: 12 },
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-outline-variant/10 editorial-shadow parchment-texture">
        <span className="font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant font-bold mb-6 block">Virtue Distribution</span>
        <h3 className="font-serif text-2xl text-primary mb-8">Dominant Moral Themes</h3>
        <div className="h-72">
          {topCategories.length > 0 ? (
            <Doughnut
              data={doughnutData}
              options={chartOptions}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/40 space-y-4">
              <div className="w-12 h-12 rounded-full border border-dashed border-outline-variant/30" />
              <p className="font-body italic italic">The pattern of your virtues is still unfolding.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-outline-variant/10 editorial-shadow parchment-texture">
        <span className="font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant font-bold mb-6 block">Activity Velocity</span>
        <h3 className="font-serif text-2xl text-primary mb-8">Weekly Transcendence</h3>
        <div className="h-72">
          {sortedWeeks.length > 0 ? (
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
                      color: '#004c3b40',
                    },
                  },
                  x: {
                    grid: { display: false },
                    border: { display: false },
                    ticks: {
                      font: { family: "'Inter', sans-serif", size: 10 },
                      color: '#004c3b40',
                    },
                  },
                },
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/40 space-y-4">
              <div className="w-12 h-12 rounded-full border border-dashed border-outline-variant/30" />
              <p className="font-body italic">Consistency is a journey that begins with a single step.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
