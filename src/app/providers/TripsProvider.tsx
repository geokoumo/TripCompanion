import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { LocalStorageTripRepository } from '../../data/repository/LocalStorageTripRepository';
import type { TripRepository } from '../../data/repository/TripRepository';
import type { Trip } from '../../features/trips/types';
import { generateId } from '../../shared/lib/id';
import { useToast } from './ToastProvider';

const repository: TripRepository = new LocalStorageTripRepository();

interface TripsContextValue {
  trips: Trip[];
  loading: boolean;
  refresh: () => Promise<void>;
  saveTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  duplicateTrip: (id: string) => Promise<void>;
}

const TripsContext = createContext<TripsContextValue | null>(null);

export function TripsProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await repository.getTrips();
      setTrips(loaded);
    } catch {
      showToast('Αποτυχία φόρτωσης ταξιδιών', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveTrip = useCallback(
    async (trip: Trip) => {
      try {
        await repository.saveTrip(trip);
        setTrips((prev) => {
          const exists = prev.some((t) => t.id === trip.id);
          return exists ? prev.map((t) => (t.id === trip.id ? trip : t)) : [...prev, trip];
        });
      } catch {
        showToast('Η αποθήκευση απέτυχε', 'error');
        throw new Error('save-failed');
      }
    },
    [showToast],
  );

  const deleteTrip = useCallback(
    async (id: string) => {
      try {
        await repository.deleteTrip(id);
        setTrips((prev) => prev.filter((t) => t.id !== id));
      } catch {
        showToast('Η διαγραφή απέτυχε', 'error');
      }
    },
    [showToast],
  );

  const duplicateTrip = useCallback(
    async (id: string) => {
      const original = trips.find((t) => t.id === id);
      if (!original) return;
      const copy: Trip = {
        ...original,
        id: generateId(),
        title: `${original.title} (αντίγραφο)`,
        archived: false,
        createdAt: new Date().toISOString(),
      };
      await saveTrip(copy);
    },
    [trips, saveTrip],
  );

  return (
    <TripsContext.Provider value={{ trips, loading, refresh, saveTrip, deleteTrip, duplicateTrip }}>
      {children}
    </TripsContext.Provider>
  );
}

export function useTripsContext(): TripsContextValue {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error('useTripsContext must be used within TripsProvider');
  return ctx;
}
