import { useEffect, useState } from 'react';
import { LocalStorageTripRepository } from '../../../data/repository/LocalStorageTripRepository';
import { storageAdapter } from '../../../data/storage/storageAdapter';
import type { Trip } from '../../trips/types';

// Deliberately separate from the trip data itself (tripcompanion:trips) —
// this only tracks whether the one-time prompt has been shown on this
// device, never trip content.
const SHOWN_FLAG_KEY = 'tripcompanion:localImportPromptShown';

/**
 * Once per device: after landing signed in, check whether local storage has
 * any trips and — if the prompt has never been shown before — surface them
 * so the user can choose to add them to their account. The flag is set as
 * soon as the check runs, whatever it finds, so this never nags on a later
 * login even if the user dismisses it or has no local trips yet.
 */
export function useLocalTripsImportPrompt(active: boolean) {
  const [localTrips, setLocalTrips] = useState<Trip[] | null>(null);

  useEffect(() => {
    if (!active) return;
    if (storageAdapter.get(SHOWN_FLAG_KEY)) return;

    let cancelled = false;
    void new LocalStorageTripRepository().getTrips().then((trips) => {
      if (cancelled) return;
      storageAdapter.set(SHOWN_FLAG_KEY, '1');
      if (trips.length > 0) setLocalTrips(trips);
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  return { localTrips, dismiss: () => setLocalTrips(null) };
}
