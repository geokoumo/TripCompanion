import { beforeEach, describe, expect, it } from 'vitest';
import {
  getRememberedTimezone,
  lookupAirportTimezone,
  rememberAirportTimezone,
  resolveTimezone,
  timezoneDisplayLabel,
} from './lib/timezones';

beforeEach(() => {
  localStorage.clear();
});

describe('lookupAirportTimezone', () => {
  it('finds a known airport regardless of case', () => {
    expect(lookupAirportTimezone('ath')).toBe('Europe/Athens');
  });

  it('returns undefined for an unknown airport', () => {
    expect(lookupAirportTimezone('ZZZ')).toBeUndefined();
  });
});

describe('remembered airport timezones', () => {
  it('has nothing remembered until one is set', () => {
    expect(getRememberedTimezone('ZZZ')).toBeUndefined();
  });

  it('remembers and recalls a manually-picked timezone, case-insensitively', () => {
    rememberAirportTimezone('zzz', 'Asia/Tokyo');
    expect(getRememberedTimezone('ZZZ')).toBe('Asia/Tokyo');
  });
});

describe('resolveTimezone', () => {
  it('prefers the known airport table over an override', () => {
    expect(resolveTimezone('ATH', 'UTC')).toBe('Europe/Athens');
  });

  it('falls back to a given override for an unknown airport', () => {
    expect(resolveTimezone('ZZZ', 'UTC')).toBe('UTC');
  });

  it('falls back to a remembered timezone when no override is given', () => {
    rememberAirportTimezone('ZZZ', 'Asia/Tokyo');
    expect(resolveTimezone('ZZZ')).toBe('Asia/Tokyo');
  });

  it('returns undefined when nothing is known, given, or remembered', () => {
    expect(resolveTimezone('ZZZ')).toBeUndefined();
  });
});

describe('timezoneDisplayLabel', () => {
  it('shows a positive UTC offset for a zone east of Greenwich', () => {
    // Mid-January: Athens is EET (UTC+2), no DST in effect.
    expect(timezoneDisplayLabel('Europe/Athens', new Date('2026-01-15T12:00:00Z'))).toBe('Europe/Athens (UTC+2)');
  });

  it('shows a zero offset for UTC itself', () => {
    expect(timezoneDisplayLabel('UTC', new Date('2026-01-15T12:00:00Z'))).toBe('UTC (UTC+0)');
  });
});
