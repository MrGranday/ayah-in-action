'use client';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "No applications yet&hellip; the first one always feels special.",
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="mb-6 opacity-20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="Ayah in Action" className="w-24 h-24 rounded-full opacity-50 grayscale" />
      </div>
      <h3 className="font-amiri text-2xl text-text-muted mb-2 italic">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-text-muted/60 max-w-sm italic">
          {description}
        </p>
      )}
    </div>
  );
}
