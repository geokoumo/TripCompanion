import { useRef, useState } from 'react';

/**
 * Wraps an async save action with a `saving` flag: guards against a fast
 * double-tap firing the same save twice (which, given the app's
 * whole-trip-aggregate write model, could otherwise race two overlapping
 * writes against each other), and gives a form something to disable/
 * relabel its primary button with while the save is in flight. Resets to
 * false whether the action resolves OR throws, so a form that stays open
 * after a failure (validation rejected it, the network call failed) is
 * re-enabled for the user to retry — never left permanently disabled.
 *
 * The in-flight check uses a ref, not the `saving` state itself: two calls
 * to `run` fired in the same synchronous tick (a fast double-tap) both read
 * `saving` from the same stale render closure, since the state update from
 * the first call hasn't flushed yet — a ref gives the guard an immediately
 * consistent value to check.
 */
export function useSavingGuard() {
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const run = async (action: () => void | Promise<void>): Promise<void> => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await action();
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return { saving, run };
}
