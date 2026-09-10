import { describe, expect, it } from 'vitest';
import { arrivesNextDay } from './lib/duration';

describe('arrivesNextDay', () => {
  it('is false for a same-day flight', () => {
    expect(arrivesNextDay('2026-06-15', '2026-06-15')).toBe(false);
  });

  it('is true when the arrival date is later', () => {
    expect(arrivesNextDay('2026-06-15', '2026-06-16')).toBe(true);
  });

  it('is false when the arrival date is somehow earlier', () => {
    expect(arrivesNextDay('2026-06-16', '2026-06-15')).toBe(false);
  });
});
