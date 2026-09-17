const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Formats "YYYY-MM-DD" as "5 Sep 2026". */
export function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  return `${day} ${SHORT_MONTHS[month - 1]} ${year}`;
}

/** Formats "YYYY-MM-DD" without the year, e.g. "5 Sep". */
export function formatDateNoYear(dateStr: string): string {
  const [, month, day] = dateStr.split('-').map(Number);
  if (!month || !day) return dateStr;
  return `${day} ${SHORT_MONTHS[month - 1]}`;
}

export function weekdayShort(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return WEEKDAY_SHORT[date.getDay()] ?? '';
}

/** Full weekday name, e.g. "Thursday" — always computed from the actual date, never hardcoded. */
export function weekdayFull(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return WEEKDAY_FULL[date.getDay()] ?? '';
}

/** Formats "YYYY-MM-DD" as "Thursday · 8 October" — full weekday and month name, no year. */
export function formatDateLong(dateStr: string): string {
  const [, month, day] = dateStr.split('-').map(Number);
  if (!month || !day) return dateStr;
  return `${weekdayFull(dateStr)} · ${day} ${FULL_MONTHS[month - 1]}`;
}

export function dayNumber(dateStr: string): number {
  return Number(dateStr.split('-')[2] ?? 0);
}

export function daysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(`${fromDateStr}T00:00:00`).getTime();
  const to = new Date(`${toDateStr}T00:00:00`).getTime();
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

/**
 * Today's calendar date in the device's own local timezone — NOT
 * `toISOString()`, which reports the UTC date and would silently read as
 * tomorrow or yesterday for a large fraction of every day in any timezone
 * away from UTC. Every date this is compared against (trip dates, activity
 * dates) is a naive local calendar-date string entered via a local date
 * picker, so "today" has to use the same local frame of reference or a
 * traveler crossing timezones would see the wrong day's itinerary as
 * "Today" for hours at a time.
 */
export function todayStr(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** "HH:mm" for the current instant, in local time — paired with todayStr() to compare against saved date+time fields, same local-time convention as todayStr() (see its comment). */
export function nowTimeStr(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
