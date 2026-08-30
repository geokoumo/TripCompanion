import { useMemo } from 'react';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import { getTripStatus } from '../types';

export function useTrips() {
  const { trips, loading, saveTrip, deleteTrip, getFullTrip } = useTripsContext();

  const sorted = useMemo(() => {
    const statusOrder = { today: 0, ongoing: 0, upcoming: 1, completed: 2 } as const;
    return [...trips].sort((a, b) => {
      const rangeA = a.startDate && a.endDate ? { startDate: a.startDate, endDate: a.endDate } : null;
      const rangeB = b.startDate && b.endDate ? { startDate: b.startDate, endDate: b.endDate } : null;
      const sa = statusOrder[getTripStatus(rangeA)];
      const sb = statusOrder[getTripStatus(rangeB)];
      if (sa !== sb) return sa - sb;
      return (rangeA?.startDate ?? '').localeCompare(rangeB?.startDate ?? '');
    });
  }, [trips]);

  return { trips: sorted, loading, saveTrip, deleteTrip, getFullTrip };
}
