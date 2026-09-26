import { useCallback, useEffect, useRef, useState } from 'react';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import { useToast } from '../../../app/providers/ToastProvider';
import { UpdateAbortedError } from '../../../shared/lib/updateTripAbort';
import type { Trip } from '../types';

export type UpdateTripResult =
  | { ok: true }
  | { ok: false; reason: 'trip-deleted' }
  | { ok: false; reason: 'aborted'; message: string };

/**
 * Loads one trip's full nested data on demand — the Home-list summary
 * (TripsProvider's `trips`) no longer carries enough to render a detail
 * screen, so opening a trip means an explicit getFullTrip(id) fetch here.
 */
export function useTrip(tripId: string | undefined) {
  const { getFullTrip, saveTrip: saveTripToContext } = useTripsContext();
  const { showToast } = useToast();
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
  // this ref so local state always reflects the latest known trip, never a
  // snapshot from whenever the callback happened to be created.
  const tripRef = useRef(trip);
  useEffect(() => {
    tripRef.current = trip;
  }, [trip]);

  const saveTrip = useCallback(
    async (next: Trip) => {
      await saveTripToContext(next);
      // Set synchronously, not just via the effect above: two fire-and-forget
      // updateTrip calls made close together each read tripRef.current at
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
  // immediately, so two calls fired close together from THIS hook instance
  // (the normal case for two independent fire-and-forget actions, e.g. two
  // quick taps on two different checklist items) always apply in order, one
  // fresh read at a time — never two concurrent fresh-reads racing each
  // other from the same tab. A rejected/aborted write doesn't jam the queue
  // for whatever's queued behind it.
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  // Every write re-fetches the latest persisted trip immediately before
  // applying the updater, rather than mutating on top of tripRef.current —
  // tripRef only ever reflects THIS hook instance's own last successful
  // save, never another tab/device/session's writes. Mutating on a stale
  // base lets two sessions silently stomp each other, and saving after
  // another session has deleted the whole trip would resurrect it outright
  // (upsert_full_trip is an insert-on-conflict-update — it can't tell "this
  // row never existed" apart from "this row was just deleted"). The updater
  // itself can additionally throw UpdateAbortedError (see
  // shared/lib/updateTripAbort.ts) when it recognizes, from the fresh trip
  // it was just handed, that its own target is gone or would be duplicated —
  // that aborts the write the same way, without ever needing a version
  // number or a second round trip.
  const updateTrip = useCallback(
    (updater: (current: Trip) => Trip): Promise<UpdateTripResult> => {
      const run = writeQueueRef.current.then(async (): Promise<UpdateTripResult> => {
        if (!tripId) return { ok: false, reason: 'trip-deleted' };

        const fresh = await getFullTrip(tripId);
        if (!fresh) {
          // Deleted (by this session or another) since this hook last knew
          // about it. Never save anything on top of a trip that's gone —
          // that would resurrect it. Refresh local state to match reality;
          // the screen that owns this hook renders its own "not found" state
          // once `trip` goes null.
          tripRef.current = null;
          setTrip(null);
          showToast('This trip was deleted.', { variant: 'error' });
          return { ok: false, reason: 'trip-deleted' };
        }

        let next: Trip;
        try {
          next = updater(fresh);
        } catch (err) {
          if (err instanceof UpdateAbortedError) {
            // Nothing is saved, but local state still catches up to the
            // fresh trip that was just read, so the UI reflects reality
            // instead of whatever stale view the caller started from.
            tripRef.current = fresh;
            setTrip(fresh);
            showToast(err.message, { variant: err.variant });
            return { ok: false, reason: 'aborted', message: err.message };
          }
          throw err;
        }

        await saveTrip(next);
        return { ok: true };
      });
      // The queue itself must never stall on a rejected write — only the
      // caller's own promise (`run`) carries that outcome forward.
      writeQueueRef.current = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
    [saveTrip, getFullTrip, tripId, showToast],
  );

  return { trip, loading, updateTrip, saveTrip };
}
