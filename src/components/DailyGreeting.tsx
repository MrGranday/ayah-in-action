'use client';

import { formatDate } from '@/lib/utils';
import type { SessionUser } from '@/types/auth';

interface DailyGreetingProps {
  user: SessionUser | null;
}

export function DailyGreeting({ user }: DailyGreetingProps) {
  const today = new Date();
  const formattedDate = formatDate(today);
  const firstName = user?.name?.split(' ')[0] || '';
  const greeting = firstName ? `, ${firstName}` : '';

  return (
    <div className="text-center mb-16 relative">
      {/* Subtle decorative arc */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <span className="font-label text-[10px] tracking-[0.4em] uppercase text-on-surface-variant block mb-6">
        The Daily Anchor
      </span>
      
      <h1 className="font-serif text-4xl md:text-5xl text-on-surface mb-6 leading-tight">
        Assalamu Alaikum<span className="text-primary italic font-light">{greeting}</span>
      </h1>
      
      <div className="max-w-md mx-auto">
        <p className="font-body text-on-surface-variant leading-relaxed italic mb-8">
          A new verse for your collection of wisdom. May it illuminate your path today.
        </p>
      </div>

      <div className="inline-flex items-center gap-4">
        <div className="h-px w-8 bg-outline-variant/30" />
        <div className="font-label text-[11px] tracking-[0.2em] uppercase text-primary font-bold">
          {formattedDate}
        </div>
        <div className="h-px w-8 bg-outline-variant/30" />
      </div>
    </div>
  );
}
