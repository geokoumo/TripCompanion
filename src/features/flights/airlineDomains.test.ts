import { describe, expect, it } from 'vitest';
import { AIRLINE_DOMAINS } from '../../config/constants';
import { matchAirlineDomain } from './lib/airlineDomains';

describe('matchAirlineDomain', () => {
  const [knownDomain, knownAirline] = Object.entries(AIRLINE_DOMAINS)[0]!;

  it('matches a known domain found anywhere in the pasted link', () => {
    expect(matchAirlineDomain(`https://www.${knownDomain}/booking/confirm?id=123`)).toBe(knownAirline);
  });

  it('matches regardless of case', () => {
    expect(matchAirlineDomain(`HTTPS://${knownDomain.toUpperCase()}/x`)).toBe(knownAirline);
  });

  it('returns undefined when no known domain is present', () => {
    expect(matchAirlineDomain('https://example.com/not-an-airline')).toBeUndefined();
  });
});
