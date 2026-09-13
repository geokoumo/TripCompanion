import { describe, expect, it } from 'vitest';
import { SharedTripSchema } from './types';

/**
 * get_shared_trip(token) only adds a tab's key at all when the owner
 * actually included that tab (see the migration) — never an empty array for
 * an excluded one, and never the whole key at all. Every field beyond the
 * base four must default cleanly from a wholly missing key, not just from
 * an explicit null/[] (that's the ordinary Zod default case; this is the
 * one this schema actually has to get right, since a share link with only
 * "overview" included is a completely realistic, common case).
 */
describe('SharedTripSchema', () => {
  it('parses the minimal shape (only overview shared: no optional tab keys present at all)', () => {
    const raw = {
      id: 't1',
      title: 'Japan 2026',
      homeCurrency: 'EUR',
      includedTabs: ['overview'],
      legs: [{ id: 'l1', city: 'Tokyo', country: 'Japan', startDate: '2026-09-05', endDate: '2026-09-10', currency: 'JPY' }],
      travelers: [{ id: 'tr1', name: 'Anna', avatarColor: 'avatar-1' }],
      // flights, stays, itineraryStops, budgetCategories, expenses,
      // checklistItems all deliberately absent.
    };
    const result = SharedTripSchema.safeParse(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.flights).toEqual([]);
      expect(result.data.stays).toEqual([]);
      expect(result.data.itineraryStops).toEqual([]);
      expect(result.data.budgetCategories).toEqual([]);
      expect(result.data.expenses).toEqual([]);
      expect(result.data.checklistItems).toEqual([]);
    }
  });

  it('parses the full shape when every tab is included', () => {
    const raw = {
      id: 't1',
      title: 'Japan 2026',
      homeCurrency: 'EUR',
      includedTabs: ['overview', 'flights', 'stays', 'itinerary', 'budget', 'checklist'],
      legs: [{ id: 'l1', city: 'Tokyo', country: 'Japan', startDate: '2026-09-05', endDate: '2026-09-10', currency: 'JPY', exchangeRateToHome: null }],
      travelers: [{ id: 'tr1', name: 'Anna', avatarColor: 'avatar-1' }],
      flights: [
        {
          id: 'f1', legId: null, airline: 'Aegean', flightNumber: 'A3601',
          depAirport: 'ATH', depDate: '2026-09-05', depTime: '10:00',
          arrAirport: 'NRT', arrDate: '2026-09-05', arrTime: '20:00', status: 'scheduled',
          terminal: null, gate: null, bookingRef: null, link: null,
          depTimezoneOverride: null, arrTimezoneOverride: null,
        },
      ],
      stays: [],
      itineraryStops: [],
      budgetCategories: [{ id: 'c1', name: 'Food', color: 'rust' }],
      expenses: [
        { id: 'e1', amount: 100, currency: 'EUR', exchangeRateToHome: null, categoryId: 'c1', date: '2026-09-05', note: null, link: null, paidBy: 'tr1', splitAmong: ['tr1'] },
      ],
      checklistItems: [{ id: 'ci1', travelerId: 'tr1', text: 'Passport', category: 'Docs', quantity: 1, done: false, link: null }],
    };
    const result = SharedTripSchema.safeParse(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.flights).toHaveLength(1);
      expect(result.data.budgetCategories).toHaveLength(1);
    }
  });

  it('rejects a share-link tab that is not one of the six recognized tabs', () => {
    const raw = {
      id: 't1',
      title: 'Japan 2026',
      homeCurrency: 'EUR',
      includedTabs: ['documents'],
      legs: [],
      travelers: [],
    };
    expect(SharedTripSchema.safeParse(raw).success).toBe(false);
  });
});
