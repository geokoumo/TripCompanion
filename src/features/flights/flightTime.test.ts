import { describe, expect, it } from 'vitest';
import { checkFlightTimeOrder } from './lib/flightTime';
import { computeFlightDuration } from './lib/duration';

describe('checkFlightTimeOrder / computeFlightDuration', () => {
  it('handles a same-day flight within one calendar day', () => {
    const input = {
      depDate: '2026-06-15',
      depTime: '10:00',
      depAirport: 'ATH',
      arrDate: '2026-06-15',
      arrTime: '12:00',
      arrAirport: 'LHR',
    };
    const result = checkFlightTimeOrder(input);
    expect(result.isValid).toBe(true);
    const duration = computeFlightDuration(input);
    expect(duration?.totalMinutes).toBe(240);
    expect(duration?.label).toBe('4ω 0λ');
  });

  it('handles an overnight flight crossing midnight', () => {
    const input = {
      depDate: '2026-06-15',
      depTime: '23:30',
      depAirport: 'JFK',
      arrDate: '2026-06-16',
      arrTime: '08:00',
      arrAirport: 'LHR',
    };
    const result = checkFlightTimeOrder(input);
    expect(result.isValid).toBe(true);
    const duration = computeFlightDuration(input);
    expect(duration?.totalMinutes).toBe(210);
    expect(duration?.label).toBe('3ω 30λ');
  });

  it('correctly accounts for a DST transition date (Athens spring-forward)', () => {
    // 2026-03-29 is the EU spring-forward date: Athens jumps from UTC+2 to UTC+3 at 03:00 local.
    const input = {
      depDate: '2026-03-28',
      depTime: '22:00',
      depAirport: 'LHR', // still GMT (UTC+0) the day before UK's own DST switch
      arrDate: '2026-03-29',
      arrTime: '08:00',
      arrAirport: 'ATH', // already EEST (UTC+3) by 08:00 local on transition day
    };
    const result = checkFlightTimeOrder(input);
    expect(result.isValid).toBe(true);
    const duration = computeFlightDuration(input);
    expect(duration?.totalMinutes).toBe(420);
  });

  it('flags an unresolved timezone when the airport is unknown and no override given', () => {
    const result = checkFlightTimeOrder({
      depDate: '2026-06-15',
      depTime: '10:00',
      depAirport: 'ZZZ',
      arrDate: '2026-06-15',
      arrTime: '12:00',
      arrAirport: 'LHR',
    });
    expect(result.unresolvedTimezone).toBe(true);
    expect(result.isValid).toBe(false);
  });

  it('rejects an arrival that is not actually after departure', () => {
    const result = checkFlightTimeOrder({
      depDate: '2026-06-15',
      depTime: '12:00',
      depAirport: 'ATH',
      arrDate: '2026-06-15',
      arrTime: '10:00',
      arrAirport: 'LHR',
    });
    expect(result.isValid).toBe(false);
  });
});
