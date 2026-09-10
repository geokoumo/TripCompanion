import { beforeEach, describe, expect, it } from 'vitest';
import { getRecentValues, rememberRecentValue } from './lib/recentValues';

beforeEach(() => {
  localStorage.clear();
});

describe('recentValues', () => {
  it('starts empty for an unused key', () => {
    expect(getRecentValues('airline')).toEqual([]);
  });

  it('remembers a value as most-recent-first', () => {
    rememberRecentValue('airline', 'Aegean');
    rememberRecentValue('airline', 'Lufthansa');
    expect(getRecentValues('airline')).toEqual(['Lufthansa', 'Aegean']);
  });

  it('ignores a blank value', () => {
    rememberRecentValue('airline', '   ');
    expect(getRecentValues('airline')).toEqual([]);
  });

  it('deduplicates case-insensitively, moving the existing entry to the front', () => {
    rememberRecentValue('airline', 'Aegean');
    rememberRecentValue('airline', 'Lufthansa');
    rememberRecentValue('airline', 'AEGEAN');
    expect(getRecentValues('airline')).toEqual(['AEGEAN', 'Lufthansa']);
  });

  it('caps the list at 8 entries', () => {
    for (let i = 0; i < 10; i++) rememberRecentValue('airline', `Airline ${i}`);
    expect(getRecentValues('airline')).toHaveLength(8);
    expect(getRecentValues('airline')[0]).toBe('Airline 9');
  });

  it('keeps separate lists per key', () => {
    rememberRecentValue('airline', 'Aegean');
    rememberRecentValue('airport', 'ATH');
    expect(getRecentValues('airline')).toEqual(['Aegean']);
    expect(getRecentValues('airport')).toEqual(['ATH']);
  });
});
