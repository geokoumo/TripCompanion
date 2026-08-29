/**
 * Per-trip remembered-location list — most-recent-first, deduplicated
 * case-insensitively, capped. Stored on the trip itself (not localStorage,
 * unlike the airline/airport recent-values), so it never leaks between trips.
 */
export function addRememberedLocation(locations: string[], value: string, cap = 10): string[] {
  const trimmed = value.trim();
  if (!trimmed) return locations;
  const deduped = locations.filter((l) => l.toLowerCase() !== trimmed.toLowerCase());
  return [trimmed, ...deduped].slice(0, cap);
}
