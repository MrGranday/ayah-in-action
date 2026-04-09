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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const doughnutData = {
    labels: topCategories.map(([cat]) => cat),
    datasets: [
      {
        data: topCategories.map(([, count]) => count),
        backgroundColor: [
          '#0a6650',
          '#0d8c6c',
          '#d4a017',
          '#e8b933',
          '#6ec9a2',
        ],
        borderWidth: 0,
      },
    ],
  };

  const sortedWeeks = Object.keys(weeklyData).sort().slice(-4);
  const barData = {
    labels: sortedWeeks.map(w => {
      const d = new Date(w);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Logs',
        data: sortedWeeks.map(w => weeklyData[w]),
        backgroundColor: '#0a6650',
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="parchment p-6">
        <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
        <div className="h-64">
          {topCategories.length > 0 ? (
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted">
              No data yet
            </div>
          )}
        </div>
      </div>

      <div className="parchment p-6">
        <h3 className="text-lg font-semibold mb-4">Weekly Activity</h3>
        <div className="h-64">
          {sortedWeeks.length > 0 ? (
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                },
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted">
              No data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
