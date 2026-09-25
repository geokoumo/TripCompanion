import type { Trip } from '../../trips/types';

export interface TravelerRemovalImpact {
  /** Expenses this traveler paid or is included in the split for — removal is blocked while this is nonzero, since deleting or reassigning money records silently would corrupt trip finances. */
  expenseCount: number;
  /** This traveler's own checklist items — removed together with them, mirroring the DB's `ON DELETE CASCADE` on checklist_items.traveler_id (a personal packing item stops mattering once its owner leaves the trip). */
  checklistItemCount: number;
  /** Itinerary stops that name this traveler specifically — the stop stays, only the assignment is dropped, mirroring the DB's cascade on itinerary_stop_travelers. */
  stopAssignmentCount: number;
}

export function getTravelerRemovalImpact(trip: Trip, travelerId: string): TravelerRemovalImpact {
  return {
    expenseCount: trip.expenses.filter((e) => e.paidBy === travelerId || e.splitAmong.includes(travelerId)).length,
    checklistItemCount: trip.checklistItems.filter((i) => i.travelerId === travelerId).length,
    stopAssignmentCount: trip.itineraryStops.filter((s) => s.travelerIds.includes(travelerId)).length,
  };
}

export function canRemoveTraveler(trip: Trip, travelerId: string): boolean {
  return getTravelerRemovalImpact(trip, travelerId).expenseCount === 0;
}

/**
 * Removes a traveler and everything that references them, except expenses —
 * callers must keep removal blocked (via canRemoveTraveler) while any
 * expense still names this traveler, since expenses.paid_by and
 * expense_split.traveler_id are ON DELETE RESTRICT deliberately.
 */
export function removeTravelerFromTrip(trip: Trip, travelerId: string): Trip {
  return {
    ...trip,
    travelers: trip.travelers.filter((t) => t.id !== travelerId),
    checklistItems: trip.checklistItems.filter((i) => i.travelerId !== travelerId),
    itineraryStops: trip.itineraryStops.map((s) => {
      if (!s.travelerIds.includes(travelerId)) return s;
      const travelerIds = s.travelerIds.filter((id) => id !== travelerId);
      // F-12: a stop that named ONLY this traveler now has an empty
      // travelerIds — the same array shape as "assigned to everyone", but
      // this one arrived there because its one assignee left, not by
      // deliberate choice. Flag it so the UI can tell the two apart instead
      // of silently relabeling it "Everyone". A stop that still names other
      // travelers is unaffected either way.
      return travelerIds.length === 0 ? { ...s, travelerIds, assignedToNobody: true } : { ...s, travelerIds };
    }),
  };
}
