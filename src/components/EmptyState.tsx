'use client';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "No applications yet… the first one always feels special.",
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="mb-6 opacity-20">
        <svg
          viewBox="0 0 100 100"
          className="w-24 h-24 text-emerald"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M50 10C50 10 25 30 25 50C25 70 50 90 50 90C50 90 75 70 75 50C75 30 50 10 50 10Z" />
          <path d="M50 20L50 80M20 50L80 50" strokeWidth="1" />
          <circle cx="50" cy="50" r="15" strokeWidth="1" />
        </svg>
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
