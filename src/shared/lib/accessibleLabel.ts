/**
 * Builds an interactive card's `aria-label` from its identity plus whatever
 * secondary details are actually present (status, "document attached",
 * date/time) — the shared convention every entity card (Flight, Stay,
 * Booking item, Stop, the Bookings Hub feed) follows so an explicit
 * `aria-label` never silently drops the same status pill or "Doc attached"
 * note a sighted user can see. Falsy extras are skipped; nothing is ever
 * invented — only real, already-visible strings are passed in.
 */
export function describeCard(identity: string, ...extras: Array<string | false | null | undefined>): string {
  return [identity, ...extras.filter((e): e is string => Boolean(e))].join(', ');
}
