import { describe, expect, it } from 'vitest';
import { hasParsedFields, parseFlightText } from './lib/parseFlightText';

describe('parseFlightText', () => {
  it('extracts every recognizable field from a well-formed confirmation', () => {
    const text = `
      Your booking is confirmed!
      Flight: EK106
      Route: ATH → DXB
      Departure: ATH (Athens) 05 Sep 2026 10:20
      Arrival: DXB (Dubai) 05 Sep 2026 18:35
      Booking reference: XY123A
    `;
    const result = parseFlightText(text);
    expect(result).toEqual({
      flightNumber: 'EK106',
      depAirport: 'ATH',
      arrAirport: 'DXB',
      depDate: '2026-09-05',
      arrDate: '2026-09-05',
      depTime: '10:20',
      arrTime: '18:35',
      bookingRef: 'XY123A',
    });
    expect(hasParsedFields(result)).toBe(true);
  });

  it('returns an empty object (never throws) for text with no recognizable flight info', () => {
    const text = 'Thanks for your purchase! Enjoy your trip and don\'t forget sunscreen.';
    const result = parseFlightText(text);
    expect(result).toEqual({});
    expect(hasParsedFields(result)).toBe(false);
  });

  it('handles empty/blank input without throwing', () => {
    expect(parseFlightText('')).toEqual({});
    expect(parseFlightText('   ')).toEqual({});
  });

  it('fills only the fields it actually found (partial match)', () => {
    const text = 'Flight EK106 departing from ATH, more details to follow.';
    const result = parseFlightText(text);
    expect(result).toEqual({
      flightNumber: 'EK106',
      depAirport: 'ATH',
    });
  });

  it('recognizes an ISO date', () => {
    const result = parseFlightText('Departure date: 2026-09-05.');
    expect(result.depDate).toBe('2026-09-05');
  });

  it('does not treat a too-short code near "confirmation" as a booking reference', () => {
    const result = parseFlightText('Your confirmation: AB12');
    expect(result.bookingRef).toBeUndefined();
  });
});
