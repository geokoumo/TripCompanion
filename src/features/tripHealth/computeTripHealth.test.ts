import { describe, expect, it } from 'vitest';
import { computeTripHealth } from './lib/computeTripHealth';
import { resolveCopy } from './lib/copy';
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

describe('computeTripHealth — trip info', () => {
  it('passes when the trip has travelers and a resolvable date range', () => {
    const report = computeTripHealth(trip(), TODAY);
    expect(report.passedChecks.some((c) => c.id === 'tripInfo')).toBe(true);
    expect(report.warnings.some((w) => w.type === 'MISSING_REQUIRED_TRIP_INFO')).toBe(false);
  });

  it('flags a trip with no travelers as MISSING_REQUIRED_TRIP_INFO, critical severity', () => {
    const report = computeTripHealth(trip({ travelers: [] }), TODAY);
    const warning = report.warnings.find((w) => w.type === 'MISSING_REQUIRED_TRIP_INFO');
    expect(warning).toBeDefined();
    expect(warning?.severity).toBe('critical');
    expect(warning?.entityType).toBe('trip');
    expect(warning?.entityId).toBe('trip1');
    expect(warning?.navigationTarget).toBe('itinerary');
    expect(resolveCopy(warning!.titleKey, warning!.params)).toBe('Trip information is incomplete');
    expect(resolveCopy(warning!.descriptionKey, warning!.params)).toContain('traveler');
    expect(report.passedChecks.some((c) => c.id === 'tripInfo')).toBe(false);
  });

  it('flags a trip with no legs (no resolvable date range) as missing start/end date', () => {
    const report = computeTripHealth(trip({ legs: [] }), TODAY);
    const fields = report.warnings.filter((w) => w.type === 'MISSING_REQUIRED_TRIP_INFO').map((w) => w.params.field);
    expect(fields).toEqual(expect.arrayContaining(['start date', 'end date']));
    expect(report.passedChecks.some((c) => c.id === 'tripInfo')).toBe(false);
  });
});

describe('computeTripHealth — activity integrity', () => {
  it('passes when there are no stops', () => {
    const report = computeTripHealth(trip(), TODAY);
    expect(report.passedChecks.some((c) => c.id === 'activityIntegrity')).toBe(true);
  });

  it('passes when every stop has fully valid data', () => {
    const report = computeTripHealth(trip({ itineraryStops: [stop()] }), TODAY);
    expect(report.passedChecks.some((c) => c.id === 'activityIntegrity')).toBe(true);
  });

  it('flags a stop scheduled outside the trip legs date range', () => {
    const wideTrip = trip({ legs: [{ id: 'l1', city: 'Tokyo', country: 'Japan', startDate: '2026-09-05', endDate: '2026-09-12', currency: 'JPY' }] });
    const report = computeTripHealth({ ...wideTrip, itineraryStops: [stop({ date: '2026-01-01' })] }, TODAY);
    const warning = report.warnings.find((w) => w.type === 'ACTIVITY_DATE_OUT_OF_RANGE');
    expect(warning).toBeDefined();
    expect(warning?.entityType).toBe('activity');
    expect(warning?.entityId).toBe('stop1');
    expect(warning?.navigationTarget).toBe('itinerary');
    expect(resolveCopy(warning!.descriptionKey, warning!.params)).toContain('outside');
    expect(report.passedChecks.some((c) => c.id === 'activityIntegrity')).toBe(false);
  });

  it('flags a stop with a blank title as MISSING_REQUIRED_ACTIVITY_INFO', () => {
    const report = computeTripHealth(trip({ itineraryStops: [stop({ title: '' })] }), TODAY);
    const warning = report.warnings.find((w) => w.type === 'MISSING_REQUIRED_ACTIVITY_INFO');
    expect(warning?.severity).toBe('warning');
    expect(warning?.params.field).toBe('title');
  });

  it('flags a stop with an invalid time as ACTIVITY_INVALID_TIME', () => {
    const report = computeTripHealth(trip({ itineraryStops: [stop({ time: 'not-a-time' })] }), TODAY);
    expect(report.warnings.some((w) => w.type === 'ACTIVITY_INVALID_TIME')).toBe(true);
  });

  it('flags a stop with a negative duration as ACTIVITY_INVALID_DURATION', () => {
    const report = computeTripHealth(trip({ itineraryStops: [stop({ durationMinutes: -30 })] }), TODAY);
    expect(report.warnings.some((w) => w.type === 'ACTIVITY_INVALID_DURATION')).toBe(true);
  });

  it('flags a stop with a price but no currency as ACTIVITY_INVALID_PRICE', () => {
    const report = computeTripHealth(trip({ itineraryStops: [stop({ price: 20, currency: undefined })] }), TODAY);
    const warning = report.warnings.find((w) => w.type === 'ACTIVITY_INVALID_PRICE');
    expect(warning).toBeDefined();
    expect(resolveCopy(warning!.titleKey)).toBe('Activity price needs a currency');
  });

  it('flags a stop with a blank (but present) location as ACTIVITY_INVALID_LOCATION', () => {
    const report = computeTripHealth(trip({ itineraryStops: [stop({ location: '   ' })] }), TODAY);
    expect(report.warnings.some((w) => w.type === 'ACTIVITY_INVALID_LOCATION')).toBe(true);
  });
});

describe('computeTripHealth — activity conflicts', () => {
  it('passes with no stops', () => {
    const report = computeTripHealth(trip(), TODAY);
    expect(report.passedChecks.some((c) => c.id === 'activityConflicts')).toBe(true);
  });

  it('passes when timed stops do not overlap', () => {
    const report = computeTripHealth(
      trip({ itineraryStops: [stop({ id: 'a', time: '10:00', durationMinutes: 60 }), stop({ id: 'b', time: '11:00', durationMinutes: 60 })] }),
      TODAY,
    );
    expect(report.passedChecks.some((c) => c.id === 'activityConflicts')).toBe(true);
  });

  it('flags two overlapping timed stops with exactly ONE warning (deduped), naming both', () => {
    const report = computeTripHealth(
      trip({
        itineraryStops: [
          stop({ id: 'a', title: 'Museum', time: '10:00', durationMinutes: 90 }),
          stop({ id: 'b', title: 'Lunch', time: '10:30', durationMinutes: 60 }),
        ],
      }),
      TODAY,
    );
    const conflicts = report.warnings.filter((w) => w.type === 'ACTIVITY_CONFLICT');
    expect(conflicts).toHaveLength(1);
    const warning = conflicts[0]!;
    expect(warning.entityType).toBe('activity');
    expect(['a', 'b']).toContain(warning.entityId);
    const description = resolveCopy(warning.descriptionKey, warning.params);
    expect(description).toContain('Museum');
    expect(description).toContain('Lunch');
    expect(report.passedChecks.some((c) => c.id === 'activityConflicts')).toBe(false);
  });

  it('never lets an all-day stop register as a conflict', () => {
    const report = computeTripHealth(
      trip({ itineraryStops: [stop({ id: 'a', allDay: true, time: undefined, durationMinutes: undefined }), stop({ id: 'b', time: '10:00', durationMinutes: 60 })] }),
      TODAY,
    );
    expect(report.passedChecks.some((c) => c.id === 'activityConflicts')).toBe(true);
  });
});

describe('computeTripHealth — stay overlaps', () => {
  it('passes with no stays or non-overlapping stays', () => {
    const report = computeTripHealth(trip({ stays: [stay({ id: 's1' }), stay({ id: 's2', checkinDate: '2026-09-12', checkoutDate: '2026-09-14' })] }), TODAY);
    expect(report.warnings.some((w) => w.type === 'STAY_OVERLAP')).toBe(false);
    expect(report.passedChecks.some((c) => c.id === 'stayOverlaps')).toBe(true);
  });

  it('flags two overlapping stays with exactly ONE warning (deduped), naming both and the overlap date', () => {
    const a = stay({ id: 's1', name: 'Tokyo Hotel', checkinDate: '2026-08-19', checkoutDate: '2026-08-25' });
    const b = stay({ id: 's2', name: 'Kyoto Hotel', checkinDate: '2026-08-25', checkoutDate: '2026-08-30', checkinTime: '10:00' });
    const report = computeTripHealth(trip({ stays: [a, b] }), TODAY);
    const overlaps = report.warnings.filter((w) => w.type === 'STAY_OVERLAP');
    expect(overlaps).toHaveLength(1);
    const warning = overlaps[0]!;
    expect(warning.entityType).toBe('stay');
    expect(warning.navigationTarget).toBe('stays');
    expect(resolveCopy(warning.titleKey)).toBe('Overlapping stays');
    const description = resolveCopy(warning.descriptionKey, warning.params);
    expect(description).toBe('Tokyo Hotel checkout overlaps with Kyoto Hotel check-in on 25 Aug.');
    expect(report.passedChecks.some((c) => c.id === 'stayOverlaps')).toBe(false);
  });

  it('does not flag adjacent stays that touch at the boundary', () => {
    const a = stay({ id: 's1', checkinDate: '2026-08-19', checkoutTime: '11:00', checkoutDate: '2026-08-25' });
    const b = stay({ id: 's2', checkinDate: '2026-08-25', checkinTime: '11:00', checkoutDate: '2026-08-30' });
    const report = computeTripHealth(trip({ stays: [a, b] }), TODAY);
    expect(report.warnings.some((w) => w.type === 'STAY_OVERLAP')).toBe(false);
  });
});

describe('computeTripHealth — boarding passes', () => {
  it('passes when there are no flights', () => {
    const report = computeTripHealth(trip(), TODAY);
    expect(report.passedChecks.some((c) => c.id === 'boardingPasses')).toBe(true);
  });

  it('ignores a flight that is far in the future', () => {
    const report = computeTripHealth(trip({ flights: [flight({ depDate: '2026-12-01' })] }), TODAY);
    expect(report.warnings.some((w) => w.type === 'MISSING_BOARDING_PASS')).toBe(false);
    expect(report.passedChecks.some((c) => c.id === 'boardingPasses')).toBe(true);
  });

  it('ignores a cancelled flight even if it is imminent', () => {
    const report = computeTripHealth(trip({ flights: [flight({ status: 'cancelled' })] }), TODAY);
    expect(report.warnings.some((w) => w.type === 'MISSING_BOARDING_PASS')).toBe(false);
  });

  it('flags an imminent flight with no attached boarding pass', () => {
    const report = computeTripHealth(trip({ flights: [flight({ depDate: TODAY })] }), TODAY);
    const warning = report.warnings.find((w) => w.type === 'MISSING_BOARDING_PASS');
    expect(warning?.entityType).toBe('flight');
    expect(warning?.entityId).toBe('f1');
    expect(warning?.navigationTarget).toBe('flights');
    expect(resolveCopy(warning!.titleKey)).toBe('Missing boarding pass');
    expect(resolveCopy(warning!.descriptionKey, warning!.params)).toContain('ANA NH1');
    expect(report.passedChecks.some((c) => c.id === 'boardingPasses')).toBe(false);
  });

  it('passes when the matching boarding pass document is attached', () => {
    const report = computeTripHealth(
      trip({
        flights: [flight({ depDate: TODAY, depAirport: 'NRT', arrAirport: 'HND' })],
        documents: [document({ category: 'boarding_pass', relatedTo: 'NRT → HND flight' })],
      }),
      TODAY,
    );
    expect(report.warnings.some((w) => w.type === 'MISSING_BOARDING_PASS')).toBe(false);
    expect(report.passedChecks.some((c) => c.id === 'boardingPasses')).toBe(true);
  });

  it('does not count a document of a different category as a boarding pass', () => {
    const report = computeTripHealth(
      trip({
        flights: [flight({ depDate: TODAY, depAirport: 'NRT', arrAirport: 'HND' })],
        documents: [document({ category: 'other', relatedTo: 'NRT → HND flight' })],
      }),
      TODAY,
    );
    expect(report.warnings.some((w) => w.type === 'MISSING_BOARDING_PASS')).toBe(true);
  });
});

describe('computeTripHealth — stay documents', () => {
  it('passes when there are no stays', () => {
    const report = computeTripHealth(trip(), TODAY);
    expect(report.passedChecks.some((c) => c.id === 'stayDocuments')).toBe(true);
  });

  it('flags a stay with no confirmation document attached, regardless of how far away it is', () => {
    const report = computeTripHealth(trip({ stays: [stay({ name: 'Park Hyatt', checkinDate: '2026-12-01' })] }), TODAY);
    const warning = report.warnings.find((w) => w.type === 'MISSING_STAY_DOCUMENT');
    expect(warning?.entityType).toBe('stay');
    expect(warning?.entityId).toBe('s1');
    expect(warning?.navigationTarget).toBe('stays');
    expect(resolveCopy(warning!.titleKey)).toBe('Missing hotel confirmation');
    expect(resolveCopy(warning!.descriptionKey, warning!.params)).toContain('Park Hyatt');
    expect(report.passedChecks.some((c) => c.id === 'stayDocuments')).toBe(false);
  });

  it('passes when a matching hotel_confirmation document is attached, matched by the stay name', () => {
    const report = computeTripHealth(
      trip({
        stays: [stay({ name: 'Park Hyatt' })],
        documents: [document({ category: 'hotel_confirmation', relatedTo: 'Park Hyatt' })],
      }),
      TODAY,
    );
    expect(report.warnings.some((w) => w.type === 'MISSING_STAY_DOCUMENT')).toBe(false);
    expect(report.passedChecks.some((c) => c.id === 'stayDocuments')).toBe(true);
  });

  it('does not count a document of a different category as a confirmation', () => {
    const report = computeTripHealth(
      trip({ stays: [stay({ name: 'Park Hyatt' })], documents: [document({ category: 'other', relatedTo: 'Park Hyatt' })] }),
      TODAY,
    );
    expect(report.warnings.some((w) => w.type === 'MISSING_STAY_DOCUMENT')).toBe(true);
  });
});

describe('computeTripHealth — exchange rates', () => {
  it('passes when every foreign-currency expense has a saved rate', () => {
    const report = computeTripHealth(trip({ expenses: [expense({ currency: 'JPY', exchangeRateToHome: 0.006 })] }), TODAY);
    expect(report.warnings.some((w) => w.type === 'MISSING_EXCHANGE_RATE')).toBe(false);
    expect(report.passedChecks.some((c) => c.id === 'exchangeRates')).toBe(true);
  });

  it('passes when expenses are already in the home currency', () => {
    const report = computeTripHealth(trip({ expenses: [expense({ currency: 'EUR' })] }), TODAY);
    expect(report.passedChecks.some((c) => c.id === 'exchangeRates')).toBe(true);
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
    const rateWarnings = report.warnings.filter((w) => w.type === 'MISSING_EXCHANGE_RATE');
    expect(rateWarnings).toHaveLength(2);
    const jpy = rateWarnings.find((w) => w.params.currency === 'JPY');
    const usd = rateWarnings.find((w) => w.params.currency === 'USD');
    expect(resolveCopy(jpy!.descriptionKey, jpy!.params)).toContain('2 JPY expenses');
    expect(resolveCopy(usd!.descriptionKey, usd!.params)).toContain('1 USD expense ');
    expect(jpy?.navigationTarget).toBe('budget');
    expect(jpy?.entityType).toBe('trip');
    expect(report.passedChecks.some((c) => c.id === 'exchangeRates')).toBe(false);
  });

  it('a zero exchange rate counts as a real, saved rate, not a missing one', () => {
    const report = computeTripHealth(trip({ expenses: [expense({ currency: 'JPY', exchangeRateToHome: 0 })] }), TODAY);
    expect(report.warnings.some((w) => w.type === 'MISSING_EXCHANGE_RATE')).toBe(false);
  });
});

describe('computeTripHealth — determinism', () => {
  it('produces identical output for identical input, independent of call order', () => {
    const t = trip({ expenses: [expense({ currency: 'JPY', exchangeRateToHome: null })] });
    expect(computeTripHealth(t, TODAY)).toEqual(computeTripHealth(t, TODAY));
  });

  it('never invents a warning when every check is satisfied', () => {
    const report = computeTripHealth(trip(), TODAY);
    expect(report.warnings).toEqual([]);
    expect(report.passedChecks.length).toBeGreaterThan(0);
  });
});
