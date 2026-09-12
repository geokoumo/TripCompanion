import { COUNTRY_CURRENCY } from '../../../config/constants';

/** Suggests a default currency code for a country. Falls back to EUR when unknown. */
export function suggestCurrencyForCountry(country: string): string {
  return COUNTRY_CURRENCY[country.trim()] ?? 'EUR';
}

/**
 * Manual fixed-rate conversion — no live FX. Returns the amount expressed in
 * home currency, or `null` when no rate is available. A missing rate is
 * never silently treated as 1:1 — that would misstate real money without
 * any indication to the user.
 */
export function convertToHome(amount: number, exchangeRateToHome: number | null | undefined): number | null {
  if (exchangeRateToHome == null) return null;
  return amount * exchangeRateToHome;
}

/**
 * Home-currency amount for an expense, or `null` when the expense is in a
 * foreign currency and has no exchange rate set yet. Callers must treat
 * `null` as "unknown" — flag it visibly, don't fold it into totals as if
 * it were zero or 1:1.
 */
export function expenseAmountInHome(
  expense: { amount: number; currency: string; exchangeRateToHome?: number | null },
  homeCurrency: string,
): number | null {
  if (expense.currency === homeCurrency) return expense.amount;
  return convertToHome(expense.amount, expense.exchangeRateToHome);
}

/** True when an expense is in a foreign currency but has no exchange rate set — the state Fix 3 blocks at save time. */
export function isMissingExchangeRate(expense: { currency: string; exchangeRateToHome?: number | null }, homeCurrency: string): boolean {
  return expense.currency !== homeCurrency && expense.exchangeRateToHome == null;
}

export interface TotalSpent {
  /** Sum of every expense that could be converted to home currency. */
  total: number;
  /** Count of expenses excluded from `total` because they're missing an exchange rate — surfaced so a caller never presents `total` as if it were the complete picture. */
  unconvertedCount: number;
}

/** Trip-wide spend in home currency, skipping (and counting) any expense that can't be converted rather than treating it as zero or 1:1. */
export function computeTotalSpent(
  expenses: { amount: number; currency: string; exchangeRateToHome?: number | null }[],
  homeCurrency: string,
): TotalSpent {
  let total = 0;
  let unconvertedCount = 0;
  for (const expense of expenses) {
    const amountHome = expenseAmountInHome(expense, homeCurrency);
    if (amountHome === null) {
      unconvertedCount += 1;
      continue;
    }
    total += amountHome;
  }
  return { total, unconvertedCount };
}
