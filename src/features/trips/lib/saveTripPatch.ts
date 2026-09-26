import { UpdateAbortedError } from '../../../shared/lib/updateTripAbort';
import type { Trip } from '../types';

/**
 * A patch's field values, or a function that derives them from the trip's
 * current (freshly-read) state — needed for a patch like "toggle archived",
 * whose new value depends on whatever the flag currently is, not on the
 * possibly-stale value a quick-action sheet was holding when it opened.
 */
export type TripPatch = Partial<Trip> | ((freshTrip: Trip) => Partial<Trip>);

/**
 * Saves a small, targeted change to a trip (description, cover photo,
 * archive toggle, share settings) without the stale-snapshot data-loss risk
 * those single-field sheets used to have: each held the whole `trip` object
 * from whenever it opened, then saved `{ ...trip, theOneFieldItOwns }` —
 * silently reverting any OTHER field a concurrent edit (another tab/device)
 * had changed in the meantime, since that stale `trip` never knew about it.
 *
 * Fixed by re-reading the trip immediately before committing (the same
 * fresh-read-before-commit pattern already used for itinerary Idea
 * assignment and traveler removal) and applying ONLY the given patch on top
 * of that fresh copy — never spreading the caller's own stale trip prop
 * into the save. Everything the patch doesn't touch comes from the fresh
 * read, so a concurrent, unrelated change survives.
 *
 * `getFullTrip` here MUST be TripsContext's getFullTripOrThrow, not its
 * ordinary getFullTrip — the two return null for different reasons, and
 * only one of them is safe to treat as "this trip doesn't exist":
 *   - null  = the repository itself confirms there's no such trip (Phase
 *     4.4C). Never falls back to the caller's stale trip in this case —
 *     that would resurrect a trip another session deleted, exactly the
 *     upsert_full_trip resurrection bug useTrip.updateTrip already guards
 *     against (see useTrip.ts). Aborts by throwing UpdateAbortedError, the
 *     same distinguishable-abort sentinel updateTrip's own updaters use.
 *   - throws = the read itself failed (network/corrupted-record/etc.) and
 *     the trip's real state is simply unknown. Also never falls back to
 *     the stale trip — but this is left to propagate as an ordinary
 *     rejection, exactly like any other save failure, so it surfaces
 *     through each caller's existing error handling as a recoverable
 *     failure ("Try again."), not a false "this trip was deleted."
 *
 * Returns the fresh trip as read (before the patch was applied), so a
 * caller that needs the pre-change value of the field it's overwriting
 * (e.g. the cover photo's old storage path, to clean it up after a
 * successful save) reads it from current data, not a stale prop either.
 */
export async function saveTripPatch(
  tripId: string,
  patch: TripPatch,
  getFullTrip: (id: string) => Promise<Trip | null>,
  onSave: (trip: Trip) => void | Promise<void>,
): Promise<Trip> {
  const fresh = await getFullTrip(tripId);
  if (!fresh) {
    throw new UpdateAbortedError('This trip was deleted.', 'error');
  }
  const resolvedPatch = typeof patch === 'function' ? patch(fresh) : patch;
  await onSave({ ...fresh, ...resolvedPatch });
  return fresh;
}
