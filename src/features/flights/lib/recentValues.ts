/**
 * Small locally-stored "recent values" list per field, offered back as
 * suggestion chips so a value typed once doesn't need retyping on the next
 * flight in the same trip. Same storage philosophy as the airport-timezone
 * table's remembered overrides (see timezones.ts) — a plain localStorage map,
 * read defensively, written on use.
 */

const RECENT_KEY_PREFIX = 'tripcompanion:recent:';
const MAX_RECENT = 8;

function readRecent(key: string): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY_PREFIX + key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

/** Most-recent-first list of previously-typed values for a field. */
export function getRecentValues(key: string): string[] {
  return readRecent(key);
}

/** Remembers a value as most-recently-used for a field, capped at 8, de-duplicated case-insensitively. */
export function rememberRecentValue(key: string, value: string): void {
  const trimmed = value.trim();
  if (!trimmed) return;
  const existing = readRecent(key).filter((v) => v.toLowerCase() !== trimmed.toLowerCase());
  localStorage.setItem(RECENT_KEY_PREFIX + key, JSON.stringify([trimmed, ...existing].slice(0, MAX_RECENT)));
}
