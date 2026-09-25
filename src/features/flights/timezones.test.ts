import { beforeEach, describe, expect, it } from 'vitest';
import {
  getRememberedTimezone,
  localDateTimeToUtc,
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

// F-07: localDateTimeToUtc must resolve the correct offset on both sides of
// a DST transition, not just the offset sampled at the naive first guess.
// America/New York's 2026 transitions: spring-forward at 2026-03-08T07:00Z
// (02:00 EST -> 03:00 EDT), fall-back at 2026-11-01T06:00Z (02:00 EDT ->
// 01:00 EST) — confirmed against the environment's own ICU tzdata before
// writing these fixtures.
describe('localDateTimeToUtc — DST transitions', () => {
  it('resolves a local time well before a spring-forward transition using the pre-transition offset', () => {
    expect(localDateTimeToUtc('2026-03-08', '01:30', 'America/New_York')).toBe(Date.parse('2026-03-08T06:30:00Z'));
  });

  it('resolves a local time well after a spring-forward transition using the post-transition offset', () => {
    expect(localDateTimeToUtc('2026-03-08', '03:30', 'America/New_York')).toBe(Date.parse('2026-03-08T07:30:00Z'));
  });

  it('resolves a local time well before a fall-back transition using the pre-transition offset', () => {
    expect(localDateTimeToUtc('2026-11-01', '00:30', 'America/New_York')).toBe(Date.parse('2026-11-01T04:30:00Z'));
  });

  it('resolves a local time well after a fall-back transition using the post-transition offset (the case the single-pass approximation got wrong)', () => {
    expect(localDateTimeToUtc('2026-11-01', '03:00', 'America/New_York')).toBe(Date.parse('2026-11-01T08:00:00Z'));
  });

  it('is unaffected by DST for a zone that does not observe it', () => {
    expect(localDateTimeToUtc('2026-11-01', '03:00', 'Asia/Tokyo')).toBe(Date.parse('2026-11-01T03:00:00+09:00'));
  });
});
