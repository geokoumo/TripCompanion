import { describe, expect, it } from 'vitest';
import { searchWithinTrip } from './lib/searchLocalTrip';
import type { Trip } from '../trips/types';

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: 'Ιαπωνία 2026',
    homeCurrency: 'EUR',
    archived: false,
    travelers: [],
    legs: [],
    flights: [],
    stays: [],
    itineraryStops: [],
    ideas: [],
    budgetCategories: [],
    rememberedLocations: [],
    expenses: [],
    checklistItems: [],
    shareSettings: { enabled: false, includedTabs: [] },
    schemaVersion: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('searchWithinTrip', () => {
  it('matches a flight by flight number', () => {
    const trip = makeTrip({
      flights: [
        {
          id: 'f1', airline: 'Aegean', flightNumber: 'A3601', depAirport: 'ATH', depDate: '2026-09-05', depTime: '10:00',
          arrAirport: 'JFK', arrDate: '2026-09-05', arrTime: '14:00', status: 'scheduled',
        },
      ],
    });
    const matches = searchWithinTrip(trip, 'a3601');
    expect(matches).toEqual([{ type: 'flight', id: 'f1', label: 'Aegean A3601 · ATH → JFK', tab: 'flights' }]);
  });

  it('matches a stay name accent-insensitively', () => {
    const trip = makeTrip({
      stays: [{ id: 's1', name: 'Ξενοδοχείο Ερμής', address: 'Οδός 1', checkinDate: '2026-09-05', checkinTime: '15:00', checkoutDate: '2026-09-10', checkoutTime: '11:00' }],
    });
    const matches = searchWithinTrip(trip, 'ερμη');
    expect(matches).toEqual([{ type: 'stay', id: 's1', label: 'Ξενοδοχείο Ερμής', tab: 'stays' }]);
  });

  it('matches an itinerary stop title and an expense note independently', () => {
    const trip = makeTrip({
      itineraryStops: [{ id: 'i1', date: '2026-09-06', time: '10:00', allDay: false, durationMinutes: 60, title: 'Μουσείο Ακρόπολης', type: 'sight', travelerIds: [], done: false }],
      budgetCategories: [{ id: 'c1', name: 'Φαγητό', color: 'rust' }],
      expenses: [{ id: 'e1', amount: 20, currency: 'EUR', categoryId: 'c1', date: '2026-09-06', note: 'Καφές στο μουσείο', paidBy: 'tr1', splitAmong: [] }],
    });
    expect(searchWithinTrip(trip, 'ακροπολ')).toEqual([{ type: 'stop', id: 'i1', label: 'Μουσείο Ακρόπολης', tab: 'itinerary' }]);
    expect(searchWithinTrip(trip, 'καφε')).toEqual([{ type: 'expense', id: 'e1', label: 'Καφές στο μουσείο', tab: 'budget' }]);
  });

  it('returns no matches for a blank query', () => {
    const trip = makeTrip({ stays: [{ id: 's1', name: 'Hotel', address: 'X', checkinDate: '2026-09-05', checkinTime: '15:00', checkoutDate: '2026-09-10', checkoutTime: '11:00' }] });
    expect(searchWithinTrip(trip, '   ')).toEqual([]);
  });
});
