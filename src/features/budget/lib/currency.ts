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
