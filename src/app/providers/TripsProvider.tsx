import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { LocalStorageTripRepository } from '../../data/repository/LocalStorageTripRepository';
import type { TripRepository } from '../../data/repository/TripRepository';
import type { Trip } from '../../features/trips/types';
import { useToast } from './ToastProvider';

const repository: TripRepository = new LocalStorageTripRepository();

interface TripsContextValue {
  trips: Trip[];
  loading: boolean;
  refresh: () => Promise<void>;
  saveTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
}

const TripsContext = createContext<TripsContextValue | null>(null);

export function TripsProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Assigned every render (cheap — just a closure swap) so it's always
  // current before any effect below runs, including the initial-load one.
  repository.onRecordError = (message: string) => showToast(message, { variant: 'error' });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await repository.getTrips();
      setTrips(loaded);
    } catch {
      showToast('Αποτυχία φόρτωσης ταξιδιών', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveTrip = useCallback(
    async (trip: Trip) => {
      const previous = trips;
      setTrips((prev) => {
        const exists = prev.some((t) => t.id === trip.id);
        return exists ? prev.map((t) => (t.id === trip.id ? trip : t)) : [...prev, trip];
      });
      try {
        await repository.saveTrip(trip);
      } catch {
        setTrips(previous);
        showToast('Η αποθήκευση απέτυχε. Δοκίμασε ξανά.', { variant: 'error' });
        throw new Error('save-failed');
      }
    },
    [trips, showToast],
  );

  const deleteTrip = useCallback(
    async (id: string) => {
      const previous = trips;
      setTrips((prev) => prev.filter((t) => t.id !== id));
      try {
        await repository.deleteTrip(id);
      } catch {
        setTrips(previous);
        showToast('Η διαγραφή απέτυχε. Δοκίμασε ξανά.', { variant: 'error' });
        throw new Error('delete-failed');
      }
    },
    [trips, showToast],
  );

  return <TripsContext.Provider value={{ trips, loading, refresh, saveTrip, deleteTrip }}>{children}</TripsContext.Provider>;
}

export function useTripsContext(): TripsContextValue {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error('useTripsContext must be used within TripsProvider');
  return ctx;
}
