import { describe, expect, it } from 'vitest';
import { isEndOnOrAfterStart, TripFormSchema } from './validation';

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
    const result = TripFormSchema.safeParse({ title: 'Παλιό ταξίδι', startDate: '2019-01-01', endDate: '2019-01-10' });
    expect(result.success).toBe(true);
  });

  it('rejects a trip whose end date precedes its start date', () => {
    const result = TripFormSchema.safeParse({ title: 'Ταξίδι', startDate: '2026-09-16', endDate: '2026-09-05' });
    expect(result.success).toBe(false);
  });
});
