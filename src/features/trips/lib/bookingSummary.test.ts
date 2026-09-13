import { describe, expect, it } from 'vitest';
import type { Flight } from '../../flights/types';
import type { Stay } from '../../stays/types';
import type { BookingItem } from '../../bookings/types';
import { getActiveBookingSummary } from './bookingSummary';

function makeFlight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: 'f1',
    airline: 'Emirates',
    flightNumber: 'EK210',
    depAirport: 'DXB',
    depDate: '2026-08-18',
    depTime: '03:00',
    arrAirport: 'HND',
    arrDate: '2026-08-18',
    arrTime: '18:00',
    status: 'scheduled',
    ...overrides,
  };
}

function makeStay(overrides: Partial<Stay> = {}): Stay {
  return {
    id: 's1',
    name: 'Park Hyatt Tokyo',
    address: '1-1-1 Higashi-Shinjuku',
    checkinDate: '2026-08-18',
    checkinTime: '15:00',
    checkoutDate: '2026-08-25',
    checkoutTime: '11:00',
    ...overrides,
  };
}

function makeBookingItem(overrides: Partial<BookingItem> = {}): BookingItem {
  return {
    id: 'b1',
    type: 'transport',
    name: 'Shinkansen to Kyoto',
    date: '2026-08-25',
    details: {},
    ...overrides,
  } as BookingItem;
}

describe('getActiveBookingSummary', () => {
  it('includes flights, stays, and booking items that have not concluded yet', () => {
    const result = getActiveBookingSummary([makeFlight()], [makeStay()], [makeBookingItem()], '2026-08-01');
    expect(result.map((r) => r.id)).toEqual(['flight-f1', 'stay-s1', 'booking-b1']);
  });

  it('drops a flight once it has already landed (arrival date before today)', () => {
    const result = getActiveBookingSummary([makeFlight({ arrDate: '2026-08-10' })], [], [], '2026-08-18');
    expect(result).toHaveLength(0);
  });

  it('drops a stay once it has already been checked out of', () => {
    const result = getActiveBookingSummary([], [makeStay({ checkoutDate: '2026-08-10' })], [], '2026-08-18');
    expect(result).toHaveLength(0);
  });

  it('drops a dated booking item once its date has passed', () => {
    const result = getActiveBookingSummary([], [], [makeBookingItem({ date: '2026-08-10' })], '2026-08-18');
    expect(result).toHaveLength(0);
  });

  it('keeps an undated booking item — it never counts as concluded', () => {
    const result = getActiveBookingSummary([], [], [makeBookingItem({ date: undefined })], '2026-08-30');
    expect(result).toHaveLength(1);
  });

  it('orders entries chronologically by their relevant date across all three kinds', () => {
    const result = getActiveBookingSummary(
      [makeFlight({ id: 'f1', depDate: '2026-08-20' })],
      [makeStay({ id: 's1', checkinDate: '2026-08-18', checkoutDate: '2026-08-30' })],
      [makeBookingItem({ id: 'b1', date: '2026-08-25' })],
      '2026-08-01',
    );
    expect(result.map((r) => r.id)).toEqual(['stay-s1', 'flight-f1', 'booking-b1']);
  });

  it('sorts an undated booking item last', () => {
    const result = getActiveBookingSummary(
      [],
      [],
      [makeBookingItem({ id: 'b1', date: undefined }), makeBookingItem({ id: 'b2', date: '2026-08-05' })],
      '2026-08-01',
    );
    expect(result.map((r) => r.id)).toEqual(['booking-b2', 'booking-b1']);
  });

  it('never invents a subtitle field — a stay subtitle reports nights from real check-in/out dates', () => {
    const result = getActiveBookingSummary([], [makeStay({ checkinDate: '2026-08-18', checkoutDate: '2026-08-25' })], [], '2026-08-01');
    expect(result[0]!.subtitle).toBe('18 Aug · 7 nights');
  });
});
