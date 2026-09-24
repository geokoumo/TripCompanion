export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * A cryptographically-random, unguessable token — for a trip's share link,
 * the one place in the app where an id doubles as a bearer secret (anyone
 * who has it gets read access to that trip, no other check). Deliberately
 * separate from generateId(): that helper falls back to Math.random() when
 * crypto.randomUUID is unavailable, which is fine for an ordinary database
 * primary key (protected by RLS regardless of guessability) but would
 * silently hand out a guessable "unguessable" token here. This throws
 * instead of ever falling back to a weak source — crypto.getRandomValues
 * has been available in every real browser for well over a decade, so
 * hitting this path at all means something is seriously wrong with the
 * environment, not a case to quietly degrade out of.
 */
export function generateShareToken(): string {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
    throw new Error('Secure random number generation is not available — cannot create a share link.');
  }
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
