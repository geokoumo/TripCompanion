import { describe, expect, it } from 'vitest';
import { checkFlightTimeOrder, type FlightTimeInput } from './flightTime';

function makeInput(overrides: Partial<FlightTimeInput> = {}): FlightTimeInput {
  return {
    depAirport: 'ATH',
    depDate: '2026-09-05',
    depTime: '10:00',
    arrAirport: 'FCO',
    arrDate: '2026-09-05',
    arrTime: '12:00',
    ...overrides,
  };
}

describe('checkFlightTimeOrder', () => {
  it('accepts a valid same-day, same-timezone flight', () => {
    const result = checkFlightTimeOrder(makeInput());
    expect(result).toMatchObject({ isValid: true, unresolvedTimezone: false });
  });

  it('accepts a valid overnight flight', () => {
    const result = checkFlightTimeOrder(makeInput({ depTime: '23:30', arrDate: '2026-09-06', arrTime: '06:00' }));
    expect(result).toMatchObject({ isValid: true, unresolvedTimezone: false });
  });

  it('accepts a valid flight crossing time zones (Athens -> New York), where local arrival clock time is earlier than local departure clock time', () => {
    // ATH (UTC+3) 10:00 dep -> real UTC 07:00; JFK (UTC-4) 11:00 same-day arrival -> real UTC 15:00. Genuinely later, despite similar local clock times.
    const result = checkFlightTimeOrder(makeInput({ depAirport: 'ATH', depTime: '10:00', arrAirport: 'JFK', arrDate: '2026-09-05', arrTime: '11:00' }));
    expect(result).toMatchObject({ isValid: true, unresolvedTimezone: false });
  });

  it('rejects a flight whose real, timezone-aware arrival instant is before its departure instant', () => {
    // Same date, same zone, arrival clock time before departure clock time — genuinely backwards.
    const result = checkFlightTimeOrder(makeInput({ depTime: '18:00', arrTime: '09:00' }));
    expect(result).toMatchObject({ isValid: false, unresolvedTimezone: false });
  });

  it('handles an unresolved (unknown) departure airport timezone safely, without crashing', () => {
    const result = checkFlightTimeOrder(makeInput({ depAirport: 'ZZZ' }));
    expect(result).toEqual({ isValid: false, unresolvedTimezone: true, depUtcMs: null, arrUtcMs: null });
  });

  it('handles an unresolved (unknown) arrival airport timezone safely, without crashing', () => {
    const result = checkFlightTimeOrder(makeInput({ arrAirport: 'ZZZ' }));
    expect(result).toEqual({ isValid: false, unresolvedTimezone: true, depUtcMs: null, arrUtcMs: null });
  });

  it('resolves an unknown airport via an explicit manual override instead of failing', () => {
    const result = checkFlightTimeOrder(makeInput({ depAirport: 'ZZZ', depTimezoneOverride: 'Europe/Athens' }));
    expect(result.unresolvedTimezone).toBe(false);
  });

  // F-07: a flight departing shortly before a DST spring-forward transition
  // and arriving shortly after it must be judged by real elapsed time (90
  // real minutes here), not by the 150 minutes the wall clock appears to
  // show — confirms the fix at the level checkFlightTimeOrder actually uses.
  it('computes a correct, DST-adjusted elapsed time across a spring-forward transition (America/New_York, 2026-03-08)', () => {
    const result = checkFlightTimeOrder(
      makeInput({ depAirport: 'JFK', depDate: '2026-03-08', depTime: '01:30', arrAirport: 'JFK', arrDate: '2026-03-08', arrTime: '04:00' }),
    );
    expect(result.isValid).toBe(true);
    expect(result.arrUtcMs! - result.depUtcMs!).toBe(90 * 60 * 1000);
  });
});
