'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'gold';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500',
        {
          'border-transparent bg-emerald text-white': variant === 'default',
          'border-transparent bg-surface text-text-primary': variant === 'secondary',
          'text-text-primary': variant === 'outline',
          'border-transparent bg-gold text-white': variant === 'gold',
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
