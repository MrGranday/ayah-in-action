'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCcw } from 'lucide-react';

import { useAyahStore } from '@/stores/useAyahStore';

export function ShuffleAyahButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const resetCurrentAyah = useAyahStore((state) => state.resetCurrentAyah);

  const handleShuffle = () => {
    setIsRefreshing(true);
    resetCurrentAyah();
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000); // UI visual feedback
  };

  return (
    <div className="flex justify-end mb-4">
      <button
        onClick={handleShuffle}
        disabled={isRefreshing}
        className="flex items-center gap-2 px-4 py-2 bg-surface-container-high hover:bg-white rounded-full text-primary font-label text-[10px] tracking-widest uppercase transition-all border border-outline-variant/10 shadow-sm disabled:opacity-50"
      >
        <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>New Random Ayah</span>
      </button>
    </div>
  );
}
