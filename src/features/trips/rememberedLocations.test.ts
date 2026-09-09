import { describe, expect, it } from 'vitest';
import { addRememberedLocation } from './lib/rememberedLocations';

describe('addRememberedLocation', () => {
  it('adds a new location to the front of the list', () => {
    expect(addRememberedLocation(['Rome'], 'Tokyo')).toEqual(['Tokyo', 'Rome']);
  });

  it('ignores a blank or whitespace-only value', () => {
    expect(addRememberedLocation(['Rome'], '   ')).toEqual(['Rome']);
  });

  it('trims the value before storing it', () => {
    expect(addRememberedLocation([], '  Tokyo  ')).toEqual(['Tokyo']);
  });

  it('deduplicates case-insensitively, moving the existing entry to the front', () => {
    expect(addRememberedLocation(['tokyo', 'Rome'], 'TOKYO')).toEqual(['TOKYO', 'Rome']);
  });

  it('caps the list at the given size, dropping the oldest entries', () => {
    const locations = ['a', 'b', 'c'];
    expect(addRememberedLocation(locations, 'd', 3)).toEqual(['d', 'a', 'b']);
  });
});
