/**
 * Thrown from inside an updateTrip updater to abort the write without
 * persisting anything. useTrip.updateTrip (see features/trips/hooks/useTrip.ts)
 * catches this specific type, refreshes local state to the fresh (unmutated)
 * trip it just read, shows `message` as a toast, and resolves with
 * `{ ok: false, reason: 'aborted', message }` instead of saving. Any other
 * thrown error still propagates as a normal save failure — this is only for
 * a write that recognizes, from the fresh trip it was just handed, that it
 * can no longer safely proceed (its target is gone, or applying it would
 * duplicate/overwrite something another session already did).
 */
export class UpdateAbortedError extends Error {
  readonly variant: 'neutral' | 'warn' | 'error';

  constructor(message: string, variant: 'neutral' | 'warn' | 'error' = 'warn') {
    super(message);
    this.variant = variant;
  }
}

/**
 * Throws UpdateAbortedError(message) if no item in `list` has this id — for
 * target-not-found protection on a targeted edit/delete, checked against the
 * freshly-read array an updateTrip updater receives (never a stale prop).
 */
export function assertExists<T extends { id: string }>(list: T[], id: string, message: string): void {
  if (!list.some((item) => item.id === id)) {
    throw new UpdateAbortedError(message, 'warn');
  }
}
