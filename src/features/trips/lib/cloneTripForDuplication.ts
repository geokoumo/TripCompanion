import { generateId } from '../../../shared/lib/id';
import type { Trip } from '../types';

/**
 * Produces a fully independent copy of `trip` for the "Duplicate trip"
 * action: every cloned entity gets a brand-new id, every internal reference
 * to a leg/traveler/budget-category is remapped to the corresponding new id,
 * and nothing that could tie the copy back to the original record is
 * carried over. No array/object from `trip` is reused by reference anywhere
 * in the result — every nested array and object is rebuilt field-by-field
 * (not JSON.stringify/parse, which would preserve every id verbatim).
 *
 * The result is a plain, unsaved Trip. The caller persists it through the
 * normal saveTrip path, exactly like a brand-new trip — this helper never
 * touches the repository itself.
 *
 * Deliberately excluded, and why:
 * - `documents` and `coverPhotoPath` — both are references into the shared
 *   trip-files Storage bucket, scoped to {user_id}/{trip_id}/. Copying the
 *   path string as-is would point the duplicate at the ORIGINAL trip's
 *   storage folder; deleteTrip wipes that whole folder when the original is
 *   deleted (see SupabaseTripRepository.deleteTrip), which would silently
 *   break the duplicate's copy. No file-copy infrastructure is introduced to
 *   make this safe, so the duplicate starts with no documents and no cover
 *   photo — same as any other brand-new trip.
 * - `expenses` — actual recorded transactions (who paid, when) describe
 *   something that already happened on the original trip; only the reusable
 *   budget *configuration* (categories, overall target) is duplicated, not
 *   the ledger itself.
 * - `shareSettings`/share token — a duplicate is never pre-shared.
 * - `archived` — resets to false, matching a brand-new trip.
 * - `createdAt` — regenerated to now; `id` is always fresh.
 */
export function cloneTripForDuplication(trip: Trip): Trip {
  const legIdMap = new Map(trip.legs.map((leg) => [leg.id, generateId()]));
  const travelerIdMap = new Map(trip.travelers.map((t) => [t.id, generateId()]));
  const budgetCategoryIdMap = new Map(trip.budgetCategories.map((c) => [c.id, generateId()]));

  // A leg/traveler reference that doesn't resolve (already-orphaned data, or
  // simply absent) is dropped rather than falling back to the original id —
  // reusing it would violate the "no original id survives" guarantee.
  const remapLegId = (legId: string | undefined | null): string | undefined => (legId ? legIdMap.get(legId) : undefined);
  const remapTravelerIds = (ids: string[]): string[] => ids.map((id) => travelerIdMap.get(id)).filter((id): id is string => !!id);

  return {
    ...trip,
    id: generateId(),
    title: `${trip.title} Copy`,
    archived: false,
    coverPhotoPath: undefined,
    travelers: trip.travelers.map((t) => ({ ...t, id: travelerIdMap.get(t.id)! })),
    legs: trip.legs.map((leg) => ({ ...leg, id: legIdMap.get(leg.id)! })),
    flights: trip.flights.map((f) => ({ ...f, id: generateId(), legId: remapLegId(f.legId) })),
    stays: trip.stays.map((s) => ({ ...s, id: generateId(), legId: remapLegId(s.legId) })),
    bookingItems: trip.bookingItems.map((b) => ({ ...b, id: generateId(), legId: remapLegId(b.legId), details: { ...b.details } })),
    documents: [],
    itineraryStops: trip.itineraryStops.map((s) => ({
      ...s,
      id: generateId(),
      legId: remapLegId(s.legId),
      travelerIds: remapTravelerIds(s.travelerIds),
    })),
    ideas: trip.ideas.map((i) => ({ ...i, id: generateId() })),
    budgetCategories: trip.budgetCategories.map((c) => ({ ...c, id: budgetCategoryIdMap.get(c.id)! })),
    rememberedLocations: [...trip.rememberedLocations],
    expenses: [],
    checklistItems: trip.checklistItems
      .filter((item) => travelerIdMap.has(item.travelerId))
      .map((item) => ({ ...item, id: generateId(), travelerId: travelerIdMap.get(item.travelerId)! })),
    shareSettings: { enabled: false, includedTabs: [] },
    createdAt: new Date().toISOString(),
  };
}
