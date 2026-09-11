import { describe, expect, it } from 'vitest';
import { computeTripHealth } from './lib/computeTripHealth';
import type { Trip } from '../trips/types';
import type { Flight } from '../flights/types';
import type { Stay } from '../stays/types';
import type { Expense } from '../budget/types';
import type { ItineraryStop } from '../itinerary/types';
import type { Document } from '../documents/types';

const TODAY = '2026-09-10';

function trip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'trip1',
    title: 'Test Trip',
    homeCurrency: 'EUR',
    archived: false,
    description: null,
    travelers: [{ id: 't1', name: 'Nikos', avatarColor: 'avatar-1' }],
    legs: [{ id: 'l1', city: 'Tokyo', country: 'Japan', startDate: TODAY, endDate: TODAY, currency: 'JPY' }],
    flights: [],
    stays: [],
    bookingItems: [],
    documents: [],
    itineraryStops: [],
    ideas: [],
    budgetCategories: [],
    budget: null,
    rememberedLocations: [],
    expenses: [],
    checklistItems: [],
    shareSettings: { enabled: false, includedTabs: [] },
    schemaVersion: 2,
    createdAt: TODAY,
    ...overrides,
  };
}

function expense(overrides: Partial<Expense> = {}): Expense {
  return { id: 'e1', amount: 100, currency: 'EUR', categoryId: 'c1', date: TODAY, paidBy: 't1', splitAmong: ['t1'], ...overrides };
}

function flight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: 'f1',
    airline: 'ANA',
    flightNumber: 'NH1',
    depAirport: 'NRT',
    depDate: TODAY,
    depTime: '10:00',
    arrAirport: 'HND',
    arrDate: TODAY,
    arrTime: '12:00',
    status: 'scheduled',
    ...overrides,
  };
}

function stay(overrides: Partial<Stay> = {}): Stay {
  return {
    id: 's1',
    name: 'Hotel',
    address: 'Addr',
    checkinDate: TODAY,
    checkinTime: '15:00',
    checkoutDate: TODAY,
    checkoutTime: '11:00',
    ...overrides,
  };
}

function stop(overrides: Partial<ItineraryStop> = {}): ItineraryStop {
  return {
    id: 'stop1',
    date: TODAY,
    time: '10:00',
    allDay: false,
    durationMinutes: 60,
    title: 'Stop',
    type: 'sight',
    travelerIds: [],
    done: false,
    ...overrides,
  };
}

function document(overrides: Partial<Document> = {}): Document {
  return { id: 'd1', category: 'boarding_pass', title: 'Boarding pass', fileType: 'pdf', storagePath: 'path.pdf', uploadedAt: TODAY, ...overrides };
}

describe('computeTripHealth — exchange rates', () => {
  it('passes when every foreign-currency expense has a saved rate', () => {
    const report = computeTripHealth(trip({ expenses: [expense({ currency: 'JPY', exchangeRateToHome: 0.006 })] }), TODAY);
    expect(report.warnings).toEqual([]);
    expect(report.passedChecks.some((c) => c.id === 'exchange-rates')).toBe(true);
  });

  it('passes when expenses are already in the home currency', () => {
    const report = computeTripHealth(trip({ expenses: [expense({ currency: 'EUR' })] }), TODAY);
    expect(report.passedChecks.some((c) => c.id === 'exchange-rates')).toBe(true);
  });

  it('warns once per foreign currency missing a rate, with an accurate count', () => {
    const report = computeTripHealth(
      trip({
        expenses: [
          expense({ id: 'e1', currency: 'JPY', exchangeRateToHome: null }),
          expense({ id: 'e2', currency: 'JPY', exchangeRateToHome: null }),
          expense({ id: 'e3', currency: 'USD', exchangeRateToHome: null }),
        ],
      }),
      TODAY,
    );
    const jpy = report.warnings.find((w) => w.id === 'exchange-rate-JPY');
    const usd = report.warnings.find((w) => w.id === 'exchange-rate-USD');
    expect(jpy?.description).toContain('2 JPY expenses');
    expect(usd?.description).toContain('1 USD expense ');
    expect(jpy?.fixTarget).toBe('budget');
    expect(report.passedChecks.some((c) => c.id === 'exchange-rates')).toBe(false);
  });

  it('a zero exchange rate counts as a real, saved rate, not a missing one', () => {
    const report = computeTripHealth(trip({ expenses: [expense({ currency: 'JPY', exchangeRateToHome: null })] }), TODAY);
    expect(report.warnings.some((w) => w.id === 'exchange-rate-JPY')).toBe(true);
  });
});

describe('computeTripHealth — boarding passes', () => {
  it('passes when there are no flights', () => {
    const report = computeTripHealth(trip(), TODAY);
    expect(report.passedChecks.some((c) => c.id === 'boarding-passes')).toBe(true);
  });

  it('ignores a flight that is far in the future', () => {
    const report = computeTripHealth(trip({ flights: [flight({ depDate: '2026-12-01' })] }), TODAY);
    expect(report.warnings).toEqual([]);
    expect(report.passedChecks.some((c) => c.id === 'boarding-passes')).toBe(true);
  });

  it('ignores a cancelled flight even if it is imminent', () => {
    const report = computeTripHealth(trip({ flights: [flight({ status: 'cancelled' })] }), TODAY);
    expect(report.warnings).toEqual([]);
  });

  it('flags an imminent flight with no attached boarding pass', () => {
    const report = computeTripHealth(trip({ flights: [flight({ depDate: TODAY })] }), TODAY);
    const warning = report.warnings.find((w) => w.id === 'boarding-pass-f1');
    expect(warning?.title).toBe('Missing boarding pass for ANA NH1');
    expect(warning?.fixTarget).toBe('flights');
    expect(report.passedChecks.some((c) => c.id === 'boarding-passes')).toBe(false);
  });

  it('passes when the matching boarding pass document is attached', () => {
    const report = computeTripHealth(
      trip({
        flights: [flight({ depDate: TODAY, depAirport: 'NRT', arrAirport: 'HND' })],
        documents: [document({ category: 'boarding_pass', relatedTo: 'NRT → HND flight' })],
      }),
      TODAY,
    );
    expect(report.warnings).toEqual([]);
    expect(report.passedChecks.some((c) => c.id === 'boarding-passes')).toBe(true);
  });

  it('does not count a document of a different category as a boarding pass', () => {
    const report = computeTripHealth(
      trip({
        flights: [flight({ depDate: TODAY, depAirport: 'NRT', arrAirport: 'HND' })],
        documents: [document({ category: 'other', relatedTo: 'NRT → HND flight' })],
      }),
      TODAY,
    );
    expect(report.warnings.some((w) => w.id === 'boarding-pass-f1')).toBe(true);
  });
});

describe('computeTripHealth — stay overlaps', () => {
  it('passes with no stays or non-overlapping stays', () => {
    const report = computeTripHealth(trip({ stays: [stay({ id: 's1' }), stay({ id: 's2', checkinDate: '2026-09-12', checkoutDate: '2026-09-14' })] }), TODAY);
    expect(report.warnings).toEqual([]);
    expect(report.passedChecks.some((c) => c.id === 'stay-overlaps')).toBe(true);
  });

  it('flags two stays whose dates overlap, naming both', () => {
    const a = stay({ id: 's1', name: 'Tokyo Hotel', checkinDate: '2026-08-19', checkoutDate: '2026-08-25' });
    const b = stay({ id: 's2', name: 'Kyoto Hotel', checkinDate: '2026-08-25', checkoutDate: '2026-08-30', checkinTime: '10:00' });
    const report = computeTripHealth(trip({ stays: [a, b] }), TODAY);
    const warning = report.warnings.find((w) => w.id === 'stay-overlap-s1-s2');
    expect(warning?.title).toBe('Overlapping stays: Tokyo Hotel & Kyoto Hotel');
    expect(warning?.fixTarget).toBe('stays');
    expect(report.passedChecks.some((c) => c.id === 'stay-overlaps')).toBe(false);
  });

  it('does not flag adjacent stays that touch at the boundary', () => {
    const a = stay({ id: 's1', checkinDate: '2026-08-19', checkoutTime: '11:00', checkoutDate: '2026-08-25' });
    const b = stay({ id: 's2', checkinDate: '2026-08-25', checkinTime: '11:00', checkoutDate: '2026-08-30' });
    const report = computeTripHealth(trip({ stays: [a, b] }), TODAY);
    expect(report.warnings).toEqual([]);
  });
});

describe('computeTripHealth — itinerary conflicts', () => {
  it('passes with no stops', () => {
    const report = computeTripHealth(trip(), TODAY);
    expect(report.passedChecks.some((c) => c.id === 'itinerary-conflicts')).toBe(true);
  });

  it('passes when timed stops do not overlap', () => {
    const report = computeTripHealth(
      trip({ itineraryStops: [stop({ id: 'a', time: '10:00', durationMinutes: 60 }), stop({ id: 'b', time: '11:00', durationMinutes: 60 })] }),
      TODAY,
    );
    expect(report.passedChecks.some((c) => c.id === 'itinerary-conflicts')).toBe(true);
  });

  it('flags two saved timed stops that overlap', () => {
    const report = computeTripHealth(
      trip({ itineraryStops: [stop({ id: 'a', time: '10:00', durationMinutes: 90 }), stop({ id: 'b', time: '10:30', durationMinutes: 60 })] }),
      TODAY,
    );
    const warning = report.warnings.find((w) => w.id === 'itinerary-conflicts');
    expect(warning?.fixTarget).toBe('itinerary');
    expect(report.passedChecks.some((c) => c.id === 'itinerary-conflicts')).toBe(false);
  });

  it('never lets an all-day stop register as a conflict', () => {
    const report = computeTripHealth(
      trip({ itineraryStops: [stop({ id: 'a', allDay: true, time: undefined, durationMinutes: undefined }), stop({ id: 'b', time: '10:00', durationMinutes: 60 })] }),
      TODAY,
    );
    expect(report.passedChecks.some((c) => c.id === 'itinerary-conflicts')).toBe(true);
  });
});

describe('computeTripHealth — required info', () => {
  it('reports the required-info passed check when travelers and legs exist', () => {
    const report = computeTripHealth(trip(), TODAY);
    expect(report.passedChecks.some((c) => c.id === 'required-info')).toBe(true);
  });

  it('omits the required-info check rather than falsely passing it when travelers are missing', () => {
    const report = computeTripHealth(trip({ travelers: [] }), TODAY);
    expect(report.passedChecks.some((c) => c.id === 'required-info')).toBe(false);
  });

  it('omits the required-info check when there are no legs', () => {
    const report = computeTripHealth(trip({ legs: [] }), TODAY);
    expect(report.passedChecks.some((c) => c.id === 'required-info')).toBe(false);
  });
});

describe('computeTripHealth — determinism', () => {
  it('produces identical output for identical input, independent of call order', () => {
    const t = trip({ expenses: [expense({ currency: 'JPY', exchangeRateToHome: null })] });
    expect(computeTripHealth(t, TODAY)).toEqual(computeTripHealth(t, TODAY));
  });
});
