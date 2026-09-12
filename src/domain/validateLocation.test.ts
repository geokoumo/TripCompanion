import { describe, expect, it } from 'vitest';
import { validateLocation } from './validateLocation';

describe('validateLocation', () => {
  it('accepts a normal location string', () => {
    expect(validateLocation('Sensō-ji Temple')).toEqual([]);
  });

  it('accepts an absent location when not required', () => {
    expect(validateLocation(undefined)).toEqual([]);
    expect(validateLocation(null)).toEqual([]);
  });

  it('flags an explicitly blank location as INVALID_LOCATION (provided but empty)', () => {
    expect(validateLocation('')).toEqual([{ code: 'INVALID_LOCATION', field: 'location' }]);
  });

  it('flags a whitespace-only location as INVALID_LOCATION', () => {
    expect(validateLocation('   ')).toEqual([{ code: 'INVALID_LOCATION', field: 'location' }]);
  });

  it('flags an absent location as MISSING_REQUIRED_DATA when required', () => {
    expect(validateLocation(undefined, { required: true })).toEqual([{ code: 'MISSING_REQUIRED_DATA', field: 'location' }]);
    expect(validateLocation(null, { required: true })).toEqual([{ code: 'MISSING_REQUIRED_DATA', field: 'location' }]);
  });

  it('still flags a blank-but-provided location as INVALID_LOCATION even when required (not MISSING_REQUIRED_DATA)', () => {
    expect(validateLocation('', { required: true })).toEqual([{ code: 'INVALID_LOCATION', field: 'location' }]);
  });

  it('accepts a provided, non-blank location when required', () => {
    expect(validateLocation('Shibuya Crossing', { required: true })).toEqual([]);
  });
});
