import { storageAdapter } from '../../../data/storage/storageAdapter';

const KEY = 'tripcompanion:continuingLocally';

/**
 * Whether this device previously chose "Continue without an account" and
 * should skip the sign-in gate on the next load, instead of forgetting the
 * choice on every refresh (the reported bug).
 *
 * Deliberately just a UI convenience flag, not itself guest data — it
 * lives under its own key, separate from tripcompanion:trips, and never
 * grants access to anything a guest on this device couldn't already reach.
 * It only ever matters while nobody is signed in (the gate's own condition
 * already requires !user first), so it never weakens or bypasses real
 * authentication. Callers must clear it the moment a real session starts,
 * so a device that later signs in — and eventually signs out again — lands
 * back on the real gate instead of silently reverting to a stale bypass.
 */
export function getPersistedGuestChoice(): boolean {
  return storageAdapter.get(KEY) === '1';
}

export function setPersistedGuestChoice(continuingLocally: boolean): void {
  if (continuingLocally) storageAdapter.set(KEY, '1');
  else storageAdapter.remove(KEY);
}
