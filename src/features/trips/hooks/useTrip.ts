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
      // Set synchronously, not just via the effect above: two fire-and-forget
      // updateTrip calls made close together (e.g. checking off two
      // checklist items in quick succession) each read tripRef.current at
      // call time, before either save resolves. Waiting on the effect alone
      // leaves a window — between this promise resolving and React actually
      // running the effect — where a queued call could still read the
      // pre-save trip. Assigning the ref here closes that window regardless
      // of render/effect timing.
      tripRef.current = next;
      setTrip(next);
    },
    [saveTripToContext],
  );

  // Every updateTrip call is chained onto the previous one rather than run
  // immediately, so a second call fired before the first's save has
  // resolved (the normal case for two independent fire-and-forget actions,
  // e.g. two quick taps on two different checklist items) always applies
  // its updater on top of the first call's result — never on the same stale
  // base, which would silently drop whichever write finishes first. A
  // rejected save doesn't jam the queue for whatever's queued behind it.
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  const updateTrip = useCallback(
    (updater: (current: Trip) => Trip) => {
      const run = writeQueueRef.current.then(() => {
        if (!tripRef.current) return;
        return saveTrip(updater(tripRef.current));
      });
      writeQueueRef.current = run.catch(() => {});
      return run;
    },
    [saveTrip],
  );

  return { trip, loading, updateTrip, saveTrip };
}
