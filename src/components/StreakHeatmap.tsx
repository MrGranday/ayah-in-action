'use client';

import dynamic from 'next/dynamic';

const CalendarHeatmap = dynamic(
  () => import('react-calendar-heatmap'),
  { ssr: false }
);

interface StreakHeatmapProps {
  values: Array<{ date: string; count: number }>;
}

export function StreakHeatmap({ values }: StreakHeatmapProps) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);
  const endDate = new Date();

  const classForValue = (value: { count?: number }) => {
    if (!value || !value.count) return 'color-empty';
    if (value.count === 1) return 'color-scale-1';
    if (value.count <= 3) return 'color-scale-2';
    return 'color-scale-3';
  };

  return (
    <div className="overflow-x-auto">
      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={values}
        classForValue={classForValue}
        showWeekdayLabels
        gutterSize={2}
        tooltipDataAttrs={(value: { date?: string; count?: number }) => {
          if (!value || !value.date) return null;
          return {
            'data-tip': `${value.count || 0} applications on ${value.date}`,
          };
        }}
      />
    </div>
  );
}
