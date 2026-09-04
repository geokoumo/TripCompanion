import { describe, expect, it } from 'vitest';
import { TripSchema } from './types';

/**
 * Regression test for the real production bug: Postgres RPCs (get_full_trip)
 * build their JSON with jsonb_build_object, which represents an unset
 * nullable column as an explicit `null` value, never an omitted key. Every
 * optional field in the domain schemas must accept that shape — this is
 * what every real signed-in trip looks like the moment any optional field
 * anywhere in it hasn't been filled in.
 */
describe('TripSchema accepts explicit null for every optional field (get_full_trip shape)', () => {
  it('parses a trip where every optional field is null, not omitted', () => {
    const raw = {
      id: 't1',
      title: 'Ιαπωνία 2026',
      homeCurrency: 'EUR',
      archived: false,
      budget: null,
      description: null,
      rememberedLocations: [],
      travelers: [{ id: 'tr1', name: 'Άννα', avatarColor: 'avatar-1' }],
      legs: [
        { id: 'l1', city: 'Τόκιο', country: 'Ιαπωνία', startDate: '2026-09-05', endDate: '2026-09-10', currency: 'JPY', exchangeRateToHome: null },
      ],
      flights: [
        {
          id: 'f1', legId: null, airline: 'Aegean', flightNumber: 'A3601',
          depAirport: 'ATH', depDate: '2026-09-05', depTime: '10:00',
          arrAirport: 'NRT', arrDate: '2026-09-05', arrTime: '20:00', status: 'scheduled',
          terminal: null, gate: null, bookingRef: null, link: null,
          depTimezoneOverride: null, arrTimezoneOverride: null,
        },
      ],
      stays: [
        {
          id: 's1', legId: null, name: 'Hotel', address: 'Some address', phone: null,
          checkinDate: '2026-09-05', checkinTime: '15:00', checkoutDate: '2026-09-10', checkoutTime: '11:00',
          bookingRef: null, notes: null, link: null,
        },
      ],
      itineraryStops: [
        {
          id: 'i1', legId: null, date: '2026-09-06', time: null, allDay: true, durationMinutes: null,
          title: 'Ξεκούραστη μέρα', type: 'rest', location: null, link: null, note: null,
          travelerIds: [], done: false,
        },
      ],
      ideas: [{ id: 'idea1', title: 'Ιδέα', type: 'sight', location: null, link: null, note: null, suggestedDate: null }],
      budgetCategories: [{ id: 'c1', name: 'Φαγητό', color: 'rust' }],
      expenses: [
        { id: 'e1', amount: 20, currency: 'JPY', exchangeRateToHome: null, categoryId: 'c1', date: '2026-09-06', note: null, link: null, paidBy: 'tr1', splitAmong: ['tr1'] },
      ],
      checklistItems: [{ id: 'ci1', travelerId: 'tr1', text: 'Διαβατήριο', category: 'Έγγραφα', quantity: 1, done: false, link: null }],
      shareSettings: { enabled: false, includedTabs: [], shareToken: null },
      schemaVersion: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const result = TripSchema.safeParse(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeFalsy();
      expect(result.data.budget).toBeFalsy();
      expect(result.data.legs[0]!.exchangeRateToHome).toBeFalsy();
      expect(result.data.flights[0]!.bookingRef).toBeFalsy();
      expect(result.data.itineraryStops[0]!.time).toBeFalsy();
      expect(result.data.shareSettings.shareToken).toBeFalsy();
    }
  });
});
