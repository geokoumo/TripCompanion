import type { ItineraryStop } from '../types';

/**
 * Location-suggestion chips for the "Location" field on an activity/stop —
 * derived live from this trip's own stop locations, most-recently-dated
 * first, deduplicated case-insensitively. Deliberately NOT drawn from
 * `trip.rememberedLocations` (that pool is for full stay/booking addresses):
 * mixing the two let a short, casual activity location like "rue" get
 * offered — and picked — as a hotel's street address, producing a stay that
 * looked broken. Since this list is computed from the stops themselves
 * there's nothing extra to persist or keep in sync.
 */
export function recentStopLocations(stops: ItineraryStop[], cap = 10): string[] {
  const sorted = [...stops].sort((a, b) => (b.date + (b.time ?? '')).localeCompare(a.date + (a.time ?? '')));
  const seen = new Set<string>();
  const result: string[] = [];
  for (const stop of sorted) {
    const location = stop.location?.trim();
    if (!location || seen.has(location.toLowerCase())) continue;
    seen.add(location.toLowerCase());
    result.push(location);
    if (result.length >= cap) break;
  }
  return result;
}
