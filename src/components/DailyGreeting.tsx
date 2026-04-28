'use client';

import { formatDate } from '@/lib/utils';
import type { SessionUser } from '@/types/auth';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { t } from '@/lib/i18n/uiStrings';

interface DailyGreetingProps {
  user: SessionUser | null;
}

export function DailyGreeting({ user }: DailyGreetingProps) {
  const activeIsoCode = useLanguageStore((state) => state.activeIsoCode);
  const today = new Date();
  const formattedDate = formatDate(today, activeIsoCode);
  const firstName = user?.name?.split(' ')[0] || '';
  const greeting = firstName ? `, ${firstName}` : '';

  return (
    <div className="text-center mb-10 relative">
      {/* Subtle decorative arc */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <span className="font-label text-[9px] tracking-[0.4em] uppercase text-on-surface-variant block mb-4">
        {t('dailyAnchor', activeIsoCode)}
      </span>
      
      <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl text-on-surface mb-4 leading-tight">
        {t('assalamuAlaikum', activeIsoCode)}<span className="text-primary italic font-light">{greeting}</span>
      </h1>
      
      <div className="max-w-md mx-auto">
        <p className="font-body text-sm text-on-surface-variant leading-relaxed italic mb-6">
          {t('greetingSubtitle', activeIsoCode)}
        </p>
      </div>
 
      <div className="inline-flex items-center gap-3">
        <div className="h-px w-6 bg-outline-variant/30" />
        <div className="font-label text-[10px] tracking-[0.2em] uppercase text-primary font-bold">
          <span dir={activeIsoCode === 'ar' || activeIsoCode === 'fa' || activeIsoCode === 'ur' ? 'rtl' : 'ltr'}>
            {formattedDate}
          </span>
        </div>
        <div className="h-px w-6 bg-outline-variant/30" />
      </div>
    </div>
  );
}
