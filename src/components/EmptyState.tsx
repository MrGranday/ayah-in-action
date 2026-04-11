'use client';

import { BookOpen, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "A legacy waiting to be written.",
  description = "Every journey begins with a single reflection. Return to the Sanctuary to begin yours.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-lg mx-auto">
      {/* Decorative Core */}
      <div className="relative mb-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 -m-8 border border-primary/5 rounded-full"
        />
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center editorial-shadow ring-1 ring-primary/10"
        >
          <BookOpen className="w-10 h-10 text-primary/20" />
          <div className="absolute -top-1 -right-1">
             <Sparkles className="w-5 h-5 text-gold/30" />
          </div>
        </motion.div>
      </div>

      <div className="space-y-4">
        <h3 className="font-serif text-3xl text-primary italic leading-tight">
          {title}
        </h3>
        {description && (
          <p className="font-body text-on-surface-variant leading-relaxed opacity-70">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
