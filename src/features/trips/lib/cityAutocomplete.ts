import { COMMON_CITIES } from '../../../config/constants';
import { normalizeForMatch as normalize } from '../../../shared/lib/textNormalize';

/** Case/accent-insensitive substring match against a city's Greek or Latin name. Free text always remains available — this only ever suggests. */
export function suggestCities(query: string, limit = 6): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const needle = normalize(trimmed);
  return COMMON_CITIES.filter((city) => normalize(city.el).includes(needle) || normalize(city.en).includes(needle))
    .map((city) => city.el)
    .slice(0, limit);
}

/** The curated country for a suggested city name, used to also drive the existing country→currency suggestion. */
export function countryForCity(cityName: string): string | undefined {
  return COMMON_CITIES.find((c) => c.el === cityName)?.country;
}
