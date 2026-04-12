'use client';

export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="text-center space-y-2">
        <div className="h-8 bg-surface rounded w-48 mx-auto" />
        <div className="h-4 bg-surface rounded w-64 mx-auto" />
      </div>
      <div className="parchment p-8 space-y-4">
        <div className="h-6 bg-surface/50 rounded w-32" />
        <div className="h-12 bg-surface/50 rounded w-full" />
        <div className="h-6 bg-surface/50 rounded w-3/4" />
      </div>
      <div className="parchment p-6 space-y-4">
        <div className="h-6 bg-surface/50 rounded w-48" />
        <div className="h-24 bg-surface/50 rounded w-full" />
        <div className="flex gap-2">
          <div className="h-8 bg-surface/50 rounded-full w-20" />
          <div className="h-8 bg-surface/50 rounded-full w-20" />
          <div className="h-8 bg-surface/50 rounded-full w-20" />
        </div>
      </div>
    </div>
  );
}
