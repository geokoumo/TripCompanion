import { useMemo } from 'react';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import { getTripStatus } from '../types';

export function useTrips() {
  const { trips, loading, saveTrip, deleteTrip, duplicateTrip } = useTripsContext();

  const sorted = useMemo(() => {
    const statusOrder = { ongoing: 0, upcoming: 1, completed: 2 } as const;
    return [...trips].sort((a, b) => {
      const sa = statusOrder[getTripStatus(a)];
      const sb = statusOrder[getTripStatus(b)];
      if (sa !== sb) return sa - sb;
      return a.startDate.localeCompare(b.startDate);
    });
  }, [trips]);

  return { trips: sorted, loading, saveTrip, deleteTrip, duplicateTrip };
}
