import { useCallback, useEffect, useRef, useState } from 'react';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import type { Trip } from '../types';

/**
 * Loads one trip's full nested data on demand — the Home-list summary
 * (TripsProvider's `trips`) no longer carries enough to render a detail
 * screen, so opening a trip means an explicit getFullTrip(id) fetch here.
 */
export function useTrip(tripId: string | undefined) {
  const { getFullTrip, saveTrip: saveTripToContext } = useTripsContext();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) {
      setTrip(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void getFullTrip(tripId).then((loaded) => {
      if (cancelled) return;
      setTrip(loaded);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tripId, getFullTrip]);

  // Callbacks (e.g. an undo toast fired seconds later) may be created from an
  // earlier render and hold a stale `trip` closure. Route every write through
  // this ref so updateTrip always applies on top of the latest known trip,
  // never a snapshot from whenever the callback happened to be created.
  const tripRef = useRef(trip);
  useEffect(() => {
    tripRef.current = trip;
  }, [trip]);

  const saveTrip = useCallback(
    async (next: Trip) => {
      await saveTripToContext(next);
      setTrip(next);
    },
    [saveTripToContext],
  );

  const updateTrip = useCallback(
    async (updater: (current: Trip) => Trip) => {
      if (!tripRef.current) return;
      await saveTrip(updater(tripRef.current));
    },
    [saveTrip],
  );

  return { trip, loading, updateTrip, saveTrip };
}
