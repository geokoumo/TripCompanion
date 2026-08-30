import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LocalStorageTripRepository } from '../../data/repository/LocalStorageTripRepository';
import { SupabaseTripRepository } from '../../data/repository/SupabaseTripRepository';
import type { TripRepository } from '../../data/repository/TripRepository';
import type { Trip } from '../../features/trips/types';
import { useAuth } from './AuthProvider';
import { useToast } from './ToastProvider';

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
  const { user } = useAuth();

  // Signed in -> Supabase is the data source; signed out -> back to local
  // storage, unchanged from how the app has always worked for anyone not
  // signed in. Only recreated when the signed-in user actually changes, not
  // on every render.
  const repository = useMemo<TripRepository>(
    () => (user ? new SupabaseTripRepository() : new LocalStorageTripRepository()),
    [user?.id],
  );

  // Assigned every render (cheap — just a closure swap) so it's always
  // current before any effect below runs, including the initial-load one.
  repository.onRecordError = (message: string) => showToast(message, { variant: 'error' });

  const refresh = useCallback(async () => {
    // Clear immediately: when `repository` just switched (sign-in/out), the
    // previous data source's trips must never stay visible even briefly.
    setTrips([]);
    setLoading(true);
    try {
      const loaded = await repository.getTrips();
      setTrips(loaded);
    } catch {
      showToast('Αποτυχία φόρτωσης ταξιδιών', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [repository, showToast]);

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
    [trips, repository, showToast],
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
    [trips, repository, showToast],
  );

  return <TripsContext.Provider value={{ trips, loading, refresh, saveTrip, deleteTrip }}>{children}</TripsContext.Provider>;
}

export function useTripsContext(): TripsContextValue {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error('useTripsContext must be used within TripsProvider');
  return ctx;
}
