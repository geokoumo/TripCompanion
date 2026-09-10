import { describe, expect, it } from 'vitest';
import { normalizeForMatch } from './lib/textNormalize';

describe('normalizeForMatch', () => {
  it('lowercases text', () => {
    expect(normalizeForMatch('ROME')).toBe('rome');
  });

  it('strips accents so matching is diacritic-insensitive', () => {
    expect(normalizeForMatch('Île-de-France')).toBe('ile-de-france');
  });

  it('strips Greek diacritics too', () => {
    expect(normalizeForMatch('Αθήνα')).toBe(normalizeForMatch('αθηνα'));
  });

  it('leaves plain ASCII text untouched apart from casing', () => {
    expect(normalizeForMatch('Tokyo')).toBe('tokyo');
  });
});
