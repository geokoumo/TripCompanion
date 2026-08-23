import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import type { Trip } from '../types';

export function useTrip(tripId: string | undefined) {
  const { trips, loading, saveTrip } = useTripsContext();

  const trip = useMemo(() => trips.find((t) => t.id === tripId) ?? null, [trips, tripId]);

  // Callbacks (e.g. an undo toast fired seconds later) may be created from an
  // earlier render and hold a stale `trip` closure. Route every write through
  // this ref so updateTrip always applies on top of the latest known trip,
  // never a snapshot from whenever the callback happened to be created.
  const tripRef = useRef(trip);
  useEffect(() => {
    tripRef.current = trip;
  }, [trip]);

  const updateTrip = useCallback(
    async (updater: (current: Trip) => Trip) => {
      if (!tripRef.current) return;
      await saveTrip(updater(tripRef.current));
    },
    [saveTrip],
  );

  return { trip, loading, updateTrip, saveTrip };
}
