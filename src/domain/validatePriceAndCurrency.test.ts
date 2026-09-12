import { describe, expect, it } from 'vitest';
import { validatePriceAndCurrency } from './validatePriceAndCurrency';

describe('validatePriceAndCurrency', () => {
  it('accepts neither price nor currency (most activities are free / untracked)', () => {
    expect(validatePriceAndCurrency({})).toEqual([]);
  });

  it('accepts a valid price with a valid currency', () => {
    expect(validatePriceAndCurrency({ price: 42.5, currency: 'EUR' })).toEqual([]);
  });

  it('accepts a zero price', () => {
    expect(validatePriceAndCurrency({ price: 0, currency: 'EUR' })).toEqual([]);
  });

  it('rejects a negative price', () => {
    expect(validatePriceAndCurrency({ price: -1, currency: 'EUR' })).toEqual([{ code: 'INVALID_PRICE', field: 'price' }]);
  });

  it('rejects NaN as a price', () => {
    expect(validatePriceAndCurrency({ price: NaN, currency: 'EUR' })).toEqual([{ code: 'INVALID_PRICE', field: 'price' }]);
  });

  it('rejects Infinity as a price', () => {
    expect(validatePriceAndCurrency({ price: Infinity, currency: 'EUR' })).toEqual([{ code: 'INVALID_PRICE', field: 'price' }]);
  });

  it('rejects a currency that is not 3 letters', () => {
    expect(validatePriceAndCurrency({ price: 10, currency: 'EU' })).toEqual([{ code: 'INVALID_CURRENCY', field: 'currency' }]);
    expect(validatePriceAndCurrency({ price: 10, currency: 'EURO' })).toEqual([{ code: 'INVALID_CURRENCY', field: 'currency' }]);
  });

  it('rejects a currency containing digits', () => {
    expect(validatePriceAndCurrency({ price: 10, currency: 'E1R' })).toEqual([{ code: 'INVALID_CURRENCY', field: 'currency' }]);
  });

  it('accepts a lowercase currency code (case-insensitive)', () => {
    expect(validatePriceAndCurrency({ price: 10, currency: 'eur' })).toEqual([]);
  });

  it('flags a price given without any currency', () => {
    expect(validatePriceAndCurrency({ price: 10 })).toEqual([{ code: 'INVALID_CURRENCY', field: 'currency' }]);
  });

  it('flags a price with a whitespace-only currency the same as a missing one', () => {
    expect(validatePriceAndCurrency({ price: 10, currency: '   ' })).toEqual([{ code: 'INVALID_CURRENCY', field: 'currency' }]);
  });

  it('does not require a currency when there is no price at all', () => {
    expect(validatePriceAndCurrency({ currency: undefined })).toEqual([]);
  });

  it('still validates a currency format even with no price present', () => {
    expect(validatePriceAndCurrency({ currency: 'XX' })).toEqual([{ code: 'INVALID_CURRENCY', field: 'currency' }]);
  });

  it('reports both an invalid price and an invalid currency together', () => {
    const errors = validatePriceAndCurrency({ price: -5, currency: 'XX' });
    expect(errors).toHaveLength(2);
    expect(errors.map((e) => e.code).sort()).toEqual(['INVALID_CURRENCY', 'INVALID_PRICE']);
  });

  it('treats null the same as undefined for both fields', () => {
    expect(validatePriceAndCurrency({ price: null, currency: null })).toEqual([]);
  });
});
