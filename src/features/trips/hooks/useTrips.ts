import { useMemo } from 'react';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import { getTripStatus } from '../types';
import { getTripDateRange } from '../lib/dateRange';

export function useTrips() {
  const { trips, loading, saveTrip, deleteTrip } = useTripsContext();

  const sorted = useMemo(() => {
    const statusOrder = { today: 0, ongoing: 0, upcoming: 1, completed: 2 } as const;
    return [...trips].sort((a, b) => {
      const rangeA = getTripDateRange(a.legs, a.flights);
      const rangeB = getTripDateRange(b.legs, b.flights);
      const sa = statusOrder[getTripStatus(rangeA)];
      const sb = statusOrder[getTripStatus(rangeB)];
      if (sa !== sb) return sa - sb;
      return (rangeA?.startDate ?? '').localeCompare(rangeB?.startDate ?? '');
    });
  }, [trips]);

  return { trips: sorted, loading, saveTrip, deleteTrip };
}
