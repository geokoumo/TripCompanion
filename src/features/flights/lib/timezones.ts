/**
 * Hand-curated airport-code -> IANA timezone table.
 * Starts with only airports actually used; unlisted codes fall back to a
 * manually-picked timezone (see resolveTimezone's `override` param).
 */
export const AIRPORT_TIMEZONES: Record<string, string> = {
  ATH: 'Europe/Athens',
  SKG: 'Europe/Athens',
  JTR: 'Europe/Athens',
  JMK: 'Europe/Athens',
  HER: 'Europe/Athens',
  RHO: 'Europe/Athens',
  CFU: 'Europe/Athens',
  LHR: 'Europe/London',
  LGW: 'Europe/London',
  CDG: 'Europe/Paris',
  ORY: 'Europe/Paris',
  FCO: 'Europe/Rome',
  MXP: 'Europe/Rome',
  BCN: 'Europe/Madrid',
  MAD: 'Europe/Madrid',
  AMS: 'Europe/Amsterdam',
  FRA: 'Europe/Berlin',
  MUC: 'Europe/Berlin',
  VIE: 'Europe/Vienna',
  ZRH: 'Europe/Zurich',
  IST: 'Europe/Istanbul',
  SAW: 'Europe/Istanbul',
  JFK: 'America/New_York',
  EWR: 'America/New_York',
  LAX: 'America/Los_Angeles',
  ORD: 'America/Chicago',
  NRT: 'Asia/Tokyo',
  HND: 'Asia/Tokyo',
  KIX: 'Asia/Tokyo',
  ITM: 'Asia/Tokyo',
  DXB: 'Asia/Dubai',
  BKK: 'Asia/Bangkok',
  DPS: 'Asia/Makassar',
};

/** A short list of well-known IANA zones offered in the manual fallback picker. */
export const MANUAL_TIMEZONE_OPTIONS = [
  'Europe/Athens',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Istanbul',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Dubai',
  'Asia/Bangkok',
  'UTC',
] as const;

const REMEMBERED_TZ_KEY = 'tripcompanion:airportTzOverrides';

function readRememberedTimezones(): Record<string, string> {
  try {
    const raw = localStorage.getItem(REMEMBERED_TZ_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** Remembers a manually-picked timezone for an unlisted airport code, for next time. */
export function rememberAirportTimezone(airportCode: string, timezone: string): void {
  const map = readRememberedTimezones();
  map[airportCode.trim().toUpperCase()] = timezone;
  localStorage.setItem(REMEMBERED_TZ_KEY, JSON.stringify(map));
}

export function getRememberedTimezone(airportCode: string): string | undefined {
  return readRememberedTimezones()[airportCode.trim().toUpperCase()];
}

/** Looks up the IANA timezone for an airport code, or undefined if unknown. */
export function lookupAirportTimezone(airportCode: string): string | undefined {
  return AIRPORT_TIMEZONES[airportCode.trim().toUpperCase()];
}

/**
 * Resolves the timezone to use for an airport: the known table lookup,
 * or a manual override remembered for that code, or undefined if neither exists.
 */
export function resolveTimezone(airportCode: string, override?: string | null): string | undefined {
  return lookupAirportTimezone(airportCode) ?? override ?? getRememberedTimezone(airportCode) ?? undefined;
}

/** UTC offset in minutes for a given IANA zone at a given instant. */
function offsetMinutesAt(timezone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  });
  const part = dtf.formatToParts(date).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+0';
  const match = /GMT([+-]\d{1,2})(?::(\d{2}))?/.exec(part);
  if (!match) return 0;
  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? '0');
  return hours < 0 ? hours * 60 - minutes : hours * 60 + minutes;
}

/** Human-readable label for a caption under a picker, e.g. "Europe/Athens (UTC+3)". */
export function timezoneDisplayLabel(timezone: string, atDate: Date = new Date()): string {
  const offsetMin = offsetMinutesAt(timezone, atDate);
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const offsetLabel = m === 0 ? `UTC${sign}${h}` : `UTC${sign}${h}:${String(m).padStart(2, '0')}`;
  return `${timezone} (${offsetLabel})`;
}

/**
 * Converts a "local wall clock" date+time string in a given IANA timezone
 * into a real UTC instant (milliseconds since epoch).
 */
export function localDateTimeToUtc(dateStr: string, timeStr: string, timezone: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  if (!year || !month || !day || hour === undefined || minute === undefined) {
    return NaN;
  }
  // Approximate as UTC first, then correct using the zone's actual offset at that instant.
  const approxUtcMs = Date.UTC(year, month - 1, day, hour, minute);
  const offsetMin = offsetMinutesAt(timezone, new Date(approxUtcMs));
  return approxUtcMs - offsetMin * 60_000;
}
