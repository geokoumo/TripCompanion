import { COUNTRY_CURRENCY } from '../../../config/constants';

/** Suggests a default currency code for a country. Falls back to EUR when unknown. */
export function suggestCurrencyForCountry(country: string): string {
  return COUNTRY_CURRENCY[country.trim()] ?? 'EUR';
}

/** Manual fixed-rate conversion — no live FX. Returns the amount expressed in home currency. */
export function convertToHome(amount: number, exchangeRateToHome: number | undefined): number {
  return amount * (exchangeRateToHome ?? 1);
}

export function expenseAmountInHome(
  expense: { amount: number; currency: string; exchangeRateToHome?: number },
  homeCurrency: string,
): number {
  if (expense.currency === homeCurrency) return expense.amount;
  return convertToHome(expense.amount, expense.exchangeRateToHome);
}
