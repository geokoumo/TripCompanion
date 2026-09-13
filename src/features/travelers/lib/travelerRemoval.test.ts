import { describe, expect, it } from 'vitest';
import type { Trip } from '../../trips/types';
import { canRemoveTraveler, getTravelerRemovalImpact, removeTravelerFromTrip } from './travelerRemoval';

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: 'Japan',
    travelers: [
      { id: 'a', name: 'Alex', avatarColor: 'avatar-1' },
      { id: 'b', name: 'Sam', avatarColor: 'avatar-2' },
    ],
    expenses: [],
    checklistItems: [],
    itineraryStops: [],
    ...overrides,
  } as Trip;
}

describe('getTravelerRemovalImpact', () => {
  it('reports zero impact for a traveler nothing references', () => {
    expect(getTravelerRemovalImpact(makeTrip(), 'a')).toEqual({ expenseCount: 0, checklistItemCount: 0, stopAssignmentCount: 0 });
  });

  it('counts expenses where the traveler is the payer', () => {
    const trip = makeTrip({ expenses: [{ id: 'e1', amount: 5, currency: 'EUR', categoryId: 'c', date: '2026-01-01', paidBy: 'a', splitAmong: ['b'] }] as Trip['expenses'] });
    expect(getTravelerRemovalImpact(trip, 'a').expenseCount).toBe(1);
  });

  it('counts expenses where the traveler is only in the split, not the payer', () => {
    const trip = makeTrip({ expenses: [{ id: 'e1', amount: 5, currency: 'EUR', categoryId: 'c', date: '2026-01-01', paidBy: 'b', splitAmong: ['a', 'b'] }] as Trip['expenses'] });
    expect(getTravelerRemovalImpact(trip, 'a').expenseCount).toBe(1);
  });

  it('counts checklist items and stop assignments separately from expenses', () => {
    const trip = makeTrip({
      checklistItems: [{ id: 'c1', travelerId: 'a', text: 'x', category: 'docs', quantity: 1, done: false }] as Trip['checklistItems'],
      itineraryStops: [{ id: 's1', travelerIds: ['a'] }] as unknown as Trip['itineraryStops'],
    });
    const impact = getTravelerRemovalImpact(trip, 'a');
    expect(impact.checklistItemCount).toBe(1);
    expect(impact.stopAssignmentCount).toBe(1);
    expect(impact.expenseCount).toBe(0);
  });
});

describe('canRemoveTraveler', () => {
  it('allows removal when there is no expense involvement', () => {
    const trip = makeTrip({ checklistItems: [{ id: 'c1', travelerId: 'a', text: 'x', category: 'docs', quantity: 1, done: false }] as Trip['checklistItems'] });
    expect(canRemoveTraveler(trip, 'a')).toBe(true);
  });

  it('blocks removal when the traveler is linked to any expense', () => {
    const trip = makeTrip({ expenses: [{ id: 'e1', amount: 5, currency: 'EUR', categoryId: 'c', date: '2026-01-01', paidBy: 'a', splitAmong: ['a'] }] as Trip['expenses'] });
    expect(canRemoveTraveler(trip, 'a')).toBe(false);
  });
});

describe('removeTravelerFromTrip', () => {
  it('drops the traveler, their checklist items, and their stop assignments, leaving stops themselves intact', () => {
    const trip = makeTrip({
      checklistItems: [
        { id: 'c1', travelerId: 'a', text: 'Passport', category: 'docs', quantity: 1, done: false },
        { id: 'c2', travelerId: 'b', text: 'Ticket', category: 'docs', quantity: 1, done: false },
      ] as Trip['checklistItems'],
      itineraryStops: [{ id: 's1', title: 'Museum', travelerIds: ['a', 'b'] }] as unknown as Trip['itineraryStops'],
    });

    const updated = removeTravelerFromTrip(trip, 'a');

    expect(updated.travelers.map((t) => t.id)).toEqual(['b']);
    expect(updated.checklistItems.map((c) => c.id)).toEqual(['c2']);
    expect(updated.itineraryStops).toHaveLength(1);
    expect((updated.itineraryStops[0] as unknown as { travelerIds: string[] }).travelerIds).toEqual(['b']);
    expect((updated.itineraryStops[0] as unknown as { title: string }).title).toBe('Museum');
  });

  it('leaves an itinerary stop untouched (including empty-meaning-all travelerIds) if it never named the removed traveler', () => {
    const trip = makeTrip({ itineraryStops: [{ id: 's1', travelerIds: [] }] as unknown as Trip['itineraryStops'] });
    const updated = removeTravelerFromTrip(trip, 'a');
    expect((updated.itineraryStops[0] as unknown as { travelerIds: string[] }).travelerIds).toEqual([]);
  });
});
