import { describe, expect, it } from 'vitest';
import { validateFlight, type FlightChronology } from './validateFlight';
import type { Flight } from './schemas';

function makeFlight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: 'f1',
    airline: 'Test Air',
    flightNumber: 'TA1',
    depAirport: 'ATH',
    depDate: '2026-09-05',
    depTime: '10:00',
    arrAirport: 'FCO',
    arrDate: '2026-09-05',
    arrTime: '12:00',
    status: 'scheduled',
    ...overrides,
  };
}

const VALID_CHRONOLOGY: FlightChronology = { isValid: true, unresolvedTimezone: false };

describe('validateFlight', () => {
  it('returns no errors for a fully valid same-day flight', () => {
    expect(validateFlight(makeFlight(), VALID_CHRONOLOGY)).toEqual([]);
  });

  it('returns no errors for a valid overnight flight (chronology-checked, not date-string-checked)', () => {
    const flight = makeFlight({ depDate: '2026-09-05', depTime: '23:30', arrDate: '2026-09-06', arrTime: '06:00' });
    expect(validateFlight(flight, VALID_CHRONOLOGY)).toEqual([]);
  });

  it('flags every missing required field', () => {
    const flight = makeFlight({ airline: '', flightNumber: '', depAirport: '', arrAirport: '' });
    const errors = validateFlight(flight);
    const fields = errors.map((e) => e.field).sort();
    expect(fields).toEqual(['airline', 'arrAirport', 'depAirport', 'flightNumber']);
  });

  it('flags missing date/time fields', () => {
    const flight = makeFlight({ depDate: '', depTime: '', arrDate: '', arrTime: '' });
    const errors = validateFlight(flight);
    const fields = errors.map((e) => e.field).sort();
    expect(fields).toEqual(['arrDate', 'arrTime', 'depDate', 'depTime']);
  });

  it('does not run a chronology check when none is supplied', () => {
    expect(validateFlight(makeFlight())).toEqual([]);
  });

  it('flags FLIGHT_TIME_ORDER when arrival is genuinely before departure (timezone-aware)', () => {
    const errors = validateFlight(makeFlight(), { isValid: false, unresolvedTimezone: false });
    expect(errors).toEqual([{ code: 'FLIGHT_TIME_ORDER', field: 'arrTime' }]);
  });

  it('does not block on an unresolved timezone even when the chronology reports invalid', () => {
    const errors = validateFlight(makeFlight(), { isValid: false, unresolvedTimezone: true });
    expect(errors).toEqual([]);
  });

  it('combines a required-field error with a chronology error', () => {
    const flight = makeFlight({ airline: '' });
    const errors = validateFlight(flight, { isValid: false, unresolvedTimezone: false });
    const codes = errors.map((e) => e.code).sort();
    expect(codes).toEqual(['FLIGHT_TIME_ORDER', 'MISSING_REQUIRED_DATA']);
  });
});
