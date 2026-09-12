import { describe, expect, it } from 'vitest';
import { getActiveBookingSummary } from './lib/bookingSummary';
import type { Flight } from '../flights/types';
import type { Stay } from '../stays/types';
import type { BookingItem } from '../bookings/types';

const TODAY = '2026-09-05';

function makeFlight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: 'f1',
    airline: 'Aegean',
    flightNumber: 'A3600',
    depAirport: 'ATH',
    depDate: '2026-09-06',
    depTime: '10:00',
    arrAirport: 'FCO',
    arrDate: '2026-09-06',
    arrTime: '12:00',
    status: 'scheduled',
    ...overrides,
  };
}

function makeStay(overrides: Partial<Stay> = {}): Stay {
  return {
    id: 's1',
    name: 'Hotel Azul',
    address: '123 Main St',
    checkinDate: '2026-09-06',
    checkinTime: '15:00',
    checkoutDate: '2026-09-09',
    checkoutTime: '11:00',
    ...overrides,
  };
}

function makeBookingItem(overrides: Partial<BookingItem> = {}): BookingItem {
  return {
    id: 'b1',
    type: 'restaurant',
    name: 'Trattoria',
    details: {},
    ...overrides,
  };
}

describe('getActiveBookingSummary', () => {
  it('includes an upcoming flight', () => {
    const result = getActiveBookingSummary([makeFlight()], [], [], TODAY);
    expect(result).toEqual([{ id: 'flight-f1', kind: 'flight', name: 'Aegean A3600', subtitle: '6 Sep · ATH → FCO' }]);
  });

  it('excludes a flight that has already landed', () => {
    const result = getActiveBookingSummary([makeFlight({ arrDate: '2026-09-01' })], [], [], TODAY);
    expect(result).toEqual([]);
  });

  it('includes a flight arriving today (not yet in the past)', () => {
    const result = getActiveBookingSummary([makeFlight({ depDate: TODAY, arrDate: TODAY })], [], [], TODAY);
    expect(result).toHaveLength(1);
  });

  it('includes an upcoming stay with a computed nights count', () => {
    const result = getActiveBookingSummary([], [makeStay()], [], TODAY);
    expect(result).toEqual([{ id: 'stay-s1', kind: 'stay', name: 'Hotel Azul', subtitle: '6 Sep · 3 nights' }]);
  });

  it('excludes a stay already checked out of', () => {
    const result = getActiveBookingSummary([], [makeStay({ checkoutDate: '2026-09-01' })], [], TODAY);
    expect(result).toEqual([]);
  });

  it('uses singular "night" for a one-night stay', () => {
    const result = getActiveBookingSummary([], [makeStay({ checkinDate: '2026-09-06', checkoutDate: '2026-09-07' })], [], TODAY);
    expect(result[0]!.subtitle).toBe('6 Sep · 1 night');
  });

  it('includes an upcoming dated booking item with its location', () => {
    const item = makeBookingItem({ date: '2026-09-07', location: 'Old Town' });
    const result = getActiveBookingSummary([], [], [item], TODAY);
    expect(result).toEqual([{ id: 'booking-b1', kind: 'restaurant', name: 'Trattoria', subtitle: '7 Sep · Old Town' }]);
  });

  it('excludes a dated booking item in the past', () => {
    const item = makeBookingItem({ date: '2026-09-01' });
    expect(getActiveBookingSummary([], [], [item], TODAY)).toEqual([]);
  });

  it('always includes an undated booking item (never treated as concluded)', () => {
    const item = makeBookingItem({ date: undefined, location: 'Somewhere' });
    const result = getActiveBookingSummary([], [], [item], TODAY);
    expect(result).toEqual([{ id: 'booking-b1', kind: 'restaurant', name: 'Trattoria', subtitle: 'Somewhere' }]);
  });

  it('sorts flights, stays, and booking items together chronologically', () => {
    const flight = makeFlight({ id: 'f1', depDate: '2026-09-08' });
    const stay = makeStay({ id: 's1', checkinDate: '2026-09-06' });
    const item = makeBookingItem({ id: 'b1', date: '2026-09-07' });
    const result = getActiveBookingSummary([flight], [stay], [item], TODAY);
    expect(result.map((e) => e.id)).toEqual(['stay-s1', 'booking-b1', 'flight-f1']);
  });

  it('sorts an undated booking item after every dated one', () => {
    const dated = makeBookingItem({ id: 'b1', date: '2026-12-01' });
    const undated = makeBookingItem({ id: 'b2', date: undefined });
    const result = getActiveBookingSummary([], [], [dated, undated], TODAY);
    expect(result.map((e) => e.id)).toEqual(['booking-b1', 'booking-b2']);
  });

  it('returns an empty list when nothing is active', () => {
    expect(getActiveBookingSummary([], [], [], TODAY)).toEqual([]);
  });
});
