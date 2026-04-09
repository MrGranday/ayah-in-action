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
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <svg
        viewBox="0 0 100 100"
        className="w-32 h-32 text-gold/30 mb-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <path d="M50 10C50 10 25 30 25 50C25 70 50 90 50 90C50 90 75 70 75 50C75 30 50 10 50 10Z" />
        <path d="M50 25L50 75M25 50L75 50" strokeWidth="0.5" />
      </svg>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-text-muted max-w-md">{description}</p>
      )}
    </div>
  );
}
