'use client';

import { useMemo } from 'react';

interface StreakHeatmapProps {
  values: Array<{ date: string; count: number }>;
}

const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildGrid(values: Array<{ date: string; count: number }>) {
  const map = new Map(values.map(v => [v.date, v.count]));

  // Always show last 52 full weeks + partial current week = GitHub style
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Start from Sunday 52 weeks ago
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (52 * 7) - startDate.getDay());

  const cols: { date: string | null; count: number }[][] = [];
  const monthLabels: { label: string; col: number }[] = [];

  let current = new Date(startDate);
  let colIdx = 0;
  let lastMonth = -1;

  while (current <= today) {
    const col: { date: string | null; count: number }[] = [];
    for (let dow = 0; dow < 7; dow++) {
      if (current > today) {
        col.push({ date: null, count: 0 });
      } else {
        const iso = current.toLocaleDateString('en-CA');
        col.push({ date: iso, count: map.get(iso) ?? 0 });
        const m = current.getMonth();
        if (m !== lastMonth && dow === 0) {
          monthLabels.push({ label: MONTHS[m], col: colIdx });
          lastMonth = m;
        }
      }
      current.setDate(current.getDate() + 1);
    }
    cols.push(col);
    colIdx++;
  }

  return { cols, monthLabels };
}

function cellColor(count: number): string {
  if (count === 0) return 'var(--heatmap-empty)';
  if (count === 1) return 'var(--heatmap-l1)';
  if (count <= 3) return 'var(--heatmap-l2)';
  return 'var(--heatmap-l3)';
}

export function StreakHeatmap({ values }: StreakHeatmapProps) {
  const { cols, monthLabels } = useMemo(() => buildGrid(values), [values]);

  const CELL = 13;   // px — cell size
  const GAP = 3;     // px — gap between cells
  const LABEL_H = 20; // px — month label row height
  const DAY_W = 30;   // px — weekday label column width

  const totalCols = cols.length;
  const svgW = DAY_W + totalCols * (CELL + GAP);
  const svgH = LABEL_H + 7 * (CELL + GAP);

  return (
    <div className="w-full overflow-x-auto pb-2">
      <svg
        width={svgW}
        height={svgH}
        style={{ minWidth: '100%', display: 'block' }}
        aria-label="Activity heatmap"
      >
        {/* Month labels */}
        {monthLabels.map(({ label, col }) => (
          <text
            key={`m-${label}-${col}`}
            x={DAY_W + col * (CELL + GAP)}
            y={LABEL_H - 6}
            fontSize={11}
            fill="currentColor"
            className="text-on-surface-variant/50 font-medium"
            style={{ fontFamily: 'var(--font-inter, system-ui)' }}
          >
            {label}
          </text>
        ))}

        {/* Weekday labels — Mon/Wed/Fri only */}
        {DAYS.map((label, i) =>
          label ? (
            <text
              key={`d-${i}`}
              x={DAY_W - 6}
              y={LABEL_H + i * (CELL + GAP) + CELL - 2}
              fontSize={10}
              fill="currentColor"
              textAnchor="end"
              className="text-on-surface-variant/40"
              style={{ fontFamily: 'var(--font-inter, system-ui)' }}
            >
              {label}
            </text>
          ) : null
        )}

        {/* Cells */}
        {cols.map((col, ci) =>
          col.map((cell, ri) =>
            cell.date ? (
              <rect
                key={`${ci}-${ri}`}
                x={DAY_W + ci * (CELL + GAP)}
                y={LABEL_H + ri * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx={3}
                ry={3}
                fill={cellColor(cell.count)}
                style={{ transition: 'fill 0.15s ease' }}
              >
                <title>{cell.count > 0 ? `${cell.count} reflection${cell.count > 1 ? 's' : ''} on ${cell.date}` : `No activity on ${cell.date}`}</title>
              </rect>
            ) : (
              <rect
                key={`${ci}-${ri}`}
                x={DAY_W + ci * (CELL + GAP)}
                y={LABEL_H + ri * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx={3}
                ry={3}
                fill="transparent"
              />
            )
          )
        )}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end pr-1">
        <span className="text-[10px] tracking-widest uppercase text-on-surface-variant/40 font-label">Less</span>
        {['var(--heatmap-empty)', 'var(--heatmap-l1)', 'var(--heatmap-l2)', 'var(--heatmap-l3)'].map((color, i) => (
          <div
            key={i}
            style={{ width: CELL, height: CELL, background: color, borderRadius: 3 }}
          />
        ))}
        <span className="text-[10px] tracking-widest uppercase text-on-surface-variant/40 font-label">More</span>
      </div>
    </div>
  );
}
