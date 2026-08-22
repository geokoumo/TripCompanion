import { useCallback, useMemo } from 'react';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import type { Trip } from '../types';

export function useTrip(tripId: string | undefined) {
  const { trips, loading, saveTrip } = useTripsContext();

  const trip = useMemo(() => trips.find((t) => t.id === tripId) ?? null, [trips, tripId]);

  const updateTrip = useCallback(
    async (updater: (current: Trip) => Trip) => {
      if (!trip) return;
      await saveTrip(updater(trip));
    },
    [trip, saveTrip],
  );

  return { trip, loading, updateTrip, saveTrip };
}
