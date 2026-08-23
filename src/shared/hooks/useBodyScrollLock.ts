import { useEffect } from 'react';

/**
 * Locks background scroll while mounted. Without this, a stacked sheet
 * (e.g. a date picker opened on top of a form sheet) can render against a
 * background that's still scrollable underneath it, which on iOS — combined
 * with a `position: fixed` sheet opening while the keyboard is still open or
 * mid-dismiss — makes the new sheet appear offset from where it should be.
 */
export function useBodyScrollLock(): void {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);
}
