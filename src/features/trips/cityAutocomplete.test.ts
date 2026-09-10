import { describe, expect, it } from 'vitest';
import { countryForCity, suggestCities } from './lib/cityAutocomplete';

describe('suggestCities', () => {
  it('returns nothing for a blank query', () => {
    expect(suggestCities('')).toEqual([]);
    expect(suggestCities('   ')).toEqual([]);
  });

  it('matches case-insensitively', () => {
    expect(suggestCities('athens')).toContain('Athens');
  });

  it('matches as a substring anywhere in the city name', () => {
    expect(suggestCities('ess')).toContain('Thessaloniki');
  });

  it('caps results at the given limit', () => {
    expect(suggestCities('a', 2)).toHaveLength(2);
  });

  it('returns an empty list when nothing matches', () => {
    expect(suggestCities('zzzznotacity')).toEqual([]);
  });
});

describe('countryForCity', () => {
  it('finds the curated country for an exact known city name', () => {
    expect(countryForCity('Athens')).toBe('Greece');
  });

  it('returns undefined for an unknown city', () => {
    expect(countryForCity('Not A Real City')).toBeUndefined();
  });
});
