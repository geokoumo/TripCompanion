/**
 * Small on-device app preferences — separate from a Trip's own fields
 * (home currency per trip, etc.). Persisted to localStorage directly rather
 * than through the trip repository, since these apply across every trip and
 * exist even with zero trips created yet.
 */
const DEFAULT_CURRENCY_KEY = 'tripcompanion:pref:defaultCurrency';
const LANGUAGE_KEY = 'tripcompanion:pref:language';
const NOTIF_TRIP_REMINDERS_KEY = 'tripcompanion:pref:notifTripReminders';
const NOTIF_SHARING_UPDATES_KEY = 'tripcompanion:pref:notifSharingUpdates';

export function getDefaultCurrency(): string {
  return localStorage.getItem(DEFAULT_CURRENCY_KEY) ?? 'EUR';
}

export function setDefaultCurrency(value: string): void {
  localStorage.setItem(DEFAULT_CURRENCY_KEY, value);
}

// English-only today — the key exists and is read/written for real so a
// future language just adds an option here, not another restyle.
export const SUPPORTED_LANGUAGES = ['en'] as const;
export type LanguageId = (typeof SUPPORTED_LANGUAGES)[number];

export function getLanguage(): LanguageId {
  const stored = localStorage.getItem(LANGUAGE_KEY);
  return stored === 'en' ? stored : 'en';
}

export function setLanguage(value: LanguageId): void {
  localStorage.setItem(LANGUAGE_KEY, value);
}

export type NotificationPrefKey = 'tripReminders' | 'sharingUpdates';

const NOTIF_STORAGE_KEY: Record<NotificationPrefKey, string> = {
  tripReminders: NOTIF_TRIP_REMINDERS_KEY,
  sharingUpdates: NOTIF_SHARING_UPDATES_KEY,
};

/** Defaults to on — matches the mockup's toggles starting enabled. Persisted preference only; no push notifications are actually sent yet. */
export function getNotificationPref(key: NotificationPrefKey): boolean {
  const raw = localStorage.getItem(NOTIF_STORAGE_KEY[key]);
  return raw === null ? true : raw === 'true';
}

export function setNotificationPref(key: NotificationPrefKey, value: boolean): void {
  localStorage.setItem(NOTIF_STORAGE_KEY[key], String(value));
}

/** The OS-resolved color scheme, for Settings' read-only Appearance row — there is no manual override to read instead. */
export function getResolvedAppearance(): 'Light' | 'Dark' {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light';
}
