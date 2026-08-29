/**
 * Best-effort local parser for pasted booking-confirmation text (e.g. copied
 * from a confirmation email). Never fetches anything — operates purely on
 * the text the user pastes. Deliberately general (no per-airline
 * special-casing): a handful of common patterns, not a maintenance burden
 * that grows with every airline's email format. Manual entry always remains
 * the reliable fallback for anything this misses.
 */

export interface ParsedFlightFields {
  flightNumber?: string;
  depAirport?: string;
  arrAirport?: string;
  depDate?: string;
  depTime?: string;
  arrDate?: string;
  arrTime?: string;
  bookingRef?: string;
}

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

function toDateString(day: string, month: string, year: string): string | null {
  const dd = day.padStart(2, '0');
  const mm = /^\d+$/.test(month) ? month.padStart(2, '0') : MONTHS[month.slice(0, 3).toLowerCase()];
  if (!mm) return null;
  const dayNum = Number(dd);
  const monthNum = Number(mm);
  if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) return null;
  const yyyy = year.length === 2 ? `20${year}` : year;
  return `${yyyy}-${mm}-${dd}`;
}

interface Span {
  index: number;
  end: number;
  value: string;
}

function collect(text: string, pattern: RegExp, toValue: (m: RegExpExecArray) => string | null, taken: Span[]): void {
  const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const start = m.index;
    const end = start + m[0].length;
    if (taken.some((t) => start < t.end && t.index < end)) continue;
    const value = toValue(m);
    if (value) taken.push({ index: start, end, value });
  }
}

function findDates(text: string): string[] {
  const taken: Span[] = [];
  // ISO (YYYY-MM-DD) first so it isn't misread as DD/MM/YYYY-shaped noise.
  collect(text, /\b(\d{4})-(\d{2})-(\d{2})\b/g, (m) => toDateString(m[3]!, m[2]!, m[1]!), taken);
  // "5 Sep 2026" / "05 September 2026"
  collect(text, /\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})\b/g, (m) => toDateString(m[1]!, m[2]!, m[3]!), taken);
  // "05/09/2026", "05-09-2026", "05.09.2026"
  collect(text, /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/g, (m) => toDateString(m[1]!, m[2]!, m[3]!), taken);
  taken.sort((a, b) => a.index - b.index);
  return taken.map((t) => t.value);
}

function findTimes(text: string): string[] {
  const taken: Span[] = [];
  collect(text, /\b([01]?\d|2[0-3]):([0-5]\d)\b/g, (m) => `${m[1]!.padStart(2, '0')}:${m[2]}`, taken);
  taken.sort((a, b) => a.index - b.index);
  return taken.map((t) => t.value);
}

/** Parses whatever it confidently recognizes out of pasted flight-confirmation text. Returns an empty object when nothing matches — never throws. */
export function parseFlightText(text: string): ParsedFlightFields {
  const result: ParsedFlightFields = {};
  if (!text?.trim()) return result;

  const flightNoMatch = /\b([A-Za-z]{2,3})\s?(\d{2,4})\b/.exec(text);
  if (flightNoMatch) {
    result.flightNumber = `${flightNoMatch[1]!.toUpperCase()}${flightNoMatch[2]}`;
  }

  const routeMatch = /\b([A-Z]{3})\s*(?:→|->|-|to)\s*([A-Z]{3})\b/.exec(text);
  if (routeMatch) {
    result.depAirport = routeMatch[1];
    result.arrAirport = routeMatch[2];
  } else {
    const fromMatch = /(?:from|από)\s*[:-]?\s*([A-Z]{3})\b/i.exec(text);
    const toMatch = /(?:\bto\b|προς)\s*[:-]?\s*([A-Z]{3})\b/i.exec(text);
    if (fromMatch) result.depAirport = fromMatch[1]!.toUpperCase();
    if (toMatch) result.arrAirport = toMatch[1]!.toUpperCase();
  }

  const dates = findDates(text);
  if (dates[0]) result.depDate = dates[0];
  if (dates[1]) result.arrDate = dates[1];

  const times = findTimes(text);
  if (times[0]) result.depTime = times[0];
  if (times[1]) result.arrTime = times[1];

  const bookingMatch = /(?:reference|confirmation|PNR|κωδικός)[^a-zA-Z0-9]{0,10}([A-Z0-9]{5,6})\b/i.exec(text);
  if (bookingMatch) result.bookingRef = bookingMatch[1]!.toUpperCase();

  return result;
}

/** True when at least one field was recognized. */
export function hasParsedFields(fields: ParsedFlightFields): boolean {
  return Object.keys(fields).length > 0;
}
