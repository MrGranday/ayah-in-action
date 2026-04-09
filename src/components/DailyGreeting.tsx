'use client';

import { formatDate, toLocalDate } from '@/lib/utils';
import type { SessionUser } from '@/types/auth';

interface DailyGreetingProps {
  user: SessionUser | null;
}

export function DailyGreeting({ user }: DailyGreetingProps) {
  const today = new Date();
  const formattedDate = formatDate(today);
  const greeting = user?.name ? `, ${user.name}` : '';

  return (
    <div className="text-center mb-8">
      <h1 className="text-2xl md:text-3xl font-semibold mb-2">
        Assalamu alaikum<span className="text-emerald">{greeting}</span>
      </h1>
      <p className="text-text-muted mb-2">
        Here is today&apos;s ayah to carry with you.
      </p>
      <div className="handwritten-date inline-block">{formattedDate}</div>
    </div>
  );
}
