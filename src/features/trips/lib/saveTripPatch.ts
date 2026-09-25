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
 * Returns the fresh trip as read (before the patch was applied), so a
 * caller that needs the pre-change value of the field it's overwriting
 * (e.g. the cover photo's old storage path, to clean it up after a
 * successful save) reads it from current data, not a stale prop either.
 */
export async function saveTripPatch(
  tripId: string,
  fallbackTrip: Trip,
  patch: TripPatch,
  getFullTrip: (id: string) => Promise<Trip | null>,
  onSave: (trip: Trip) => void | Promise<void>,
): Promise<Trip> {
  const fresh = (await getFullTrip(tripId)) ?? fallbackTrip;
  const resolvedPatch = typeof patch === 'function' ? patch(fresh) : patch;
  await onSave({ ...fresh, ...resolvedPatch });
  return fresh;
}
