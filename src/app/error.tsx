'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Root error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h2 className="text-3xl font-bold mb-4">Something went wrong</h2>
      <p className="text-text-muted mb-4 max-w-md">
        {error.message || 'An unexpected error occurred'}
      </p>
      <pre className="text-xs text-text-muted mb-6 max-w-2xl overflow-auto">
        {error.stack}
      </pre>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}