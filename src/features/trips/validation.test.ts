import { describe, expect, it } from 'vitest';
import { hasInvalidDateOrder, isEndOnOrAfterStart, TripFormSchema } from './validation';
import type { Leg } from './types';
import type { Stay } from '../stays/types';

function leg(overrides: Partial<Leg> = {}): Leg {
  return { id: 'l1', city: 'Rome', country: 'Italy', startDate: '2026-09-05', endDate: '2026-09-08', currency: 'EUR', ...overrides };
}

function stay(overrides: Partial<Stay> = {}): Stay {
  return {
    id: 's1',
    name: 'Hotel Roma',
    address: 'Via Roma 1',
    checkinDate: '2026-09-05',
    checkinTime: '14:00',
    checkoutDate: '2026-09-08',
    checkoutTime: '11:00',
    ...overrides,
  };
}

describe('trip/leg date validation', () => {
  it('accepts end date equal to start date', () => {
    expect(isEndOnOrAfterStart('2026-09-05', '2026-09-05')).toBe(true);
  });

  it('accepts end date after start date', () => {
    expect(isEndOnOrAfterStart('2026-09-05', '2026-09-16')).toBe(true);
  });

  it('rejects end date before start date', () => {
    expect(isEndOnOrAfterStart('2026-09-05', '2026-09-01')).toBe(false);
  });

  it('allows past dates (diary mode) as long as order is valid', () => {
    const result = TripFormSchema.safeParse({ title: 'Old trip', startDate: '2019-01-01', endDate: '2019-01-10' });
    expect(result.success).toBe(true);
  });

  it('rejects a trip whose end date precedes its start date', () => {
    const result = TripFormSchema.safeParse({ title: 'Trip', startDate: '2026-09-16', endDate: '2026-09-05' });
    expect(result.success).toBe(false);
  });
});

// F-08: the save-time guard shared by both repository backends and by import.
describe('hasInvalidDateOrder', () => {
  it('returns false for an empty trip', () => {
    expect(hasInvalidDateOrder({ legs: [], stays: [] })).toBe(false);
  });

  it('returns false for legs and stays with valid (or equal) date order', () => {
    expect(hasInvalidDateOrder({ legs: [leg()], stays: [stay()] })).toBe(false);
    expect(hasInvalidDateOrder({ legs: [leg({ startDate: '2026-09-05', endDate: '2026-09-05' })], stays: [] })).toBe(false);
  });

  it('flags a leg whose end date precedes its start date', () => {
    expect(hasInvalidDateOrder({ legs: [leg({ startDate: '2026-09-08', endDate: '2026-09-05' })], stays: [] })).toBe(true);
  });

  it('flags a stay whose checkout precedes its checkin', () => {
    expect(hasInvalidDateOrder({ legs: [], stays: [stay({ checkinDate: '2026-09-08', checkoutDate: '2026-09-05' })] })).toBe(true);
  });

  it('flags a stay whose checkout is the same date but an earlier time than checkin', () => {
    expect(
      hasInvalidDateOrder({
        legs: [],
        stays: [stay({ checkinDate: '2026-09-05', checkinTime: '18:00', checkoutDate: '2026-09-05', checkoutTime: '09:00' })],
      }),
    ).toBe(true);
  });
});
