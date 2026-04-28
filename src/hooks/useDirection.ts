'use client';

import { useLanguageStore } from '@/stores/useLanguageStore';

/**
 * useDirection
 * Provides the current text direction (RTL/LTR) and helpers.
 * Mandatory for BiDi (Bidirectional) UI support in Ayah in Action.
 */
export function useDirection() {
  const direction = useLanguageStore((state) => state.config.direction);
  
  return {
    direction,
    isRTL: direction === 'rtl',
    isLTR: direction === 'ltr',
    // Convenience prop for DOM 'dir' attribute
    dir: direction,
  };
}
