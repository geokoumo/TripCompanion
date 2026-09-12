import type { DomainError } from './errors';

const CURRENCY_RE = /^[A-Za-z]{3}$/;

export interface PriceInput {
  price?: number | null;
  currency?: string | null;
}

/**
 * Validates a price/currency pair together, since a price is meaningless
 * without knowing what it's denominated in. Both fields are optional at
 * the call site (most activities don't track a cost at all) — these checks
 * only fire once a value is actually present:
 *
 * - a price, if given, must be a finite number that isn't negative.
 * - a currency, if given, must look like a 3-letter ISO-4217-style code.
 * - a price given without any currency is flagged too — an amount with no
 *   denomination can't be reasoned about anywhere downstream (Trip Health,
 *   budget totals).
 */
export function validatePriceAndCurrency({ price, currency }: PriceInput): DomainError[] {
  const errors: DomainError[] = [];

  const hasPrice = price !== undefined && price !== null;
  const trimmedCurrency = currency?.trim() ?? '';
  const hasCurrency = trimmedCurrency.length > 0;

  if (hasPrice && (!Number.isFinite(price) || price! < 0)) {
    errors.push({ code: 'INVALID_PRICE', field: 'price' });
  }

  if (hasCurrency && !CURRENCY_RE.test(trimmedCurrency)) {
    errors.push({ code: 'INVALID_CURRENCY', field: 'currency' });
  } else if (hasPrice && !hasCurrency) {
    errors.push({ code: 'INVALID_CURRENCY', field: 'currency' });
  }

  return errors;
}
