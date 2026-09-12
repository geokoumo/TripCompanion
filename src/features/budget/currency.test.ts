import { describe, expect, it } from 'vitest';
import { computeTotalSpent, convertToHome, expenseAmountInHome, isMissingExchangeRate, suggestCurrencyForCountry } from './lib/currency';

describe('suggestCurrencyForCountry', () => {
  it('falls back to EUR for an unrecognized country', () => {
    expect(suggestCurrencyForCountry('Narnia')).toBe('EUR');
  });

  it('trims whitespace before looking up the country', () => {
    expect(suggestCurrencyForCountry('  Japan  ')).toBe(suggestCurrencyForCountry('Japan'));
  });
});

describe('convertToHome', () => {
  it('returns null when no exchange rate is available, never silently assuming 1:1', () => {
    expect(convertToHome(100, null)).toBeNull();
    expect(convertToHome(100, undefined)).toBeNull();
  });

  it('multiplies the amount by the given rate', () => {
    expect(convertToHome(100, 0.9)).toBeCloseTo(90);
  });

  it('treats a zero rate as a real, known rate rather than "missing"', () => {
    expect(convertToHome(100, 0)).toBe(0);
  });
});

describe('expenseAmountInHome', () => {
  it('returns the raw amount unconverted when already in home currency', () => {
    const expense = { amount: 50, currency: 'EUR' };
    expect(expenseAmountInHome(expense, 'EUR')).toBe(50);
  });

  it('returns null for a foreign-currency expense with no exchange rate set', () => {
    const expense = { amount: 50, currency: 'JPY' };
    expect(expenseAmountInHome(expense, 'EUR')).toBeNull();
  });

  it('converts a foreign-currency expense using its stored rate', () => {
    const expense = { amount: 1000, currency: 'JPY', exchangeRateToHome: 0.006 };
    expect(expenseAmountInHome(expense, 'EUR')).toBeCloseTo(6);
  });
});

describe('isMissingExchangeRate', () => {
  it('is false for a home-currency expense even with no rate set', () => {
    expect(isMissingExchangeRate({ currency: 'EUR' }, 'EUR')).toBe(false);
  });

  it('is true for a foreign-currency expense with no rate set', () => {
    expect(isMissingExchangeRate({ currency: 'JPY' }, 'EUR')).toBe(true);
  });

  it('is false once a foreign-currency expense has a rate, even a zero one', () => {
    expect(isMissingExchangeRate({ currency: 'JPY', exchangeRateToHome: 0 }, 'EUR')).toBe(false);
  });
});

describe('computeTotalSpent', () => {
  it('sums every convertible expense', () => {
    const expenses = [
      { amount: 50, currency: 'EUR' },
      { amount: 20, currency: 'EUR' },
    ];
    expect(computeTotalSpent(expenses, 'EUR')).toEqual({ total: 70, unconvertedCount: 0 });
  });

  it('excludes and counts expenses missing an exchange rate rather than treating them as zero or 1:1', () => {
    const expenses = [
      { amount: 50, currency: 'EUR' },
      { amount: 1000, currency: 'JPY' },
    ];
    expect(computeTotalSpent(expenses, 'EUR')).toEqual({ total: 50, unconvertedCount: 1 });
  });

  it('converts foreign-currency expenses that do have a stored rate', () => {
    const expenses = [{ amount: 1000, currency: 'JPY', exchangeRateToHome: 0.006 }];
    const result = computeTotalSpent(expenses, 'EUR');
    expect(result.total).toBeCloseTo(6);
    expect(result.unconvertedCount).toBe(0);
  });

  it('returns zero/zero for an empty list', () => {
    expect(computeTotalSpent([], 'EUR')).toEqual({ total: 0, unconvertedCount: 0 });
  });
});
