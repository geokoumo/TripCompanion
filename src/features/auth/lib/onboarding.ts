import { storageAdapter } from '../../../data/storage/storageAdapter';

// Deliberately separate from trip data — tracks only whether this device has
// been through the Welcome flow once (either signed in/up, or explicitly
// chose to continue without an account). Once true, a signed-out visitor
// goes straight to local-only mode instead of seeing Welcome again.
const ONBOARDED_KEY = 'tripcompanion:onboarded';

export function isOnboarded(): boolean {
  return storageAdapter.get(ONBOARDED_KEY) === '1';
}

export function markOnboarded(): void {
  storageAdapter.set(ONBOARDED_KEY, '1');
}
