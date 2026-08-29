import { AIRLINE_DOMAINS } from '../../../config/constants';

/**
 * Pure string matching against the pasted link text itself — the link is
 * never fetched or requested. Returns the airline name for the first known
 * domain found as a substring of the link, or undefined if none match.
 */
export function matchAirlineDomain(link: string): string | undefined {
  const lower = link.toLowerCase();
  for (const [domain, airline] of Object.entries(AIRLINE_DOMAINS)) {
    if (lower.includes(domain)) return airline;
  }
  return undefined;
}
