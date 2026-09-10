import { beforeEach, describe, expect, it } from 'vitest';
import {
  getDefaultCurrency,
  getLanguage,
  getNotificationPref,
  setDefaultCurrency,
  setLanguage,
  setNotificationPref,
} from './lib/preferences';

beforeEach(() => {
  localStorage.clear();
});

describe('getDefaultCurrency / setDefaultCurrency', () => {
  it('defaults to EUR when nothing is stored', () => {
    expect(getDefaultCurrency()).toBe('EUR');
  });

  it('persists and returns a set value', () => {
    setDefaultCurrency('USD');
    expect(getDefaultCurrency()).toBe('USD');
  });
});

describe('getLanguage / setLanguage', () => {
  it('defaults to "en"', () => {
    expect(getLanguage()).toBe('en');
  });

  it('persists and returns a set value', () => {
    setLanguage('en');
    expect(getLanguage()).toBe('en');
  });

  it('falls back to "en" for a corrupted stored value', () => {
    localStorage.setItem('tripcompanion:pref:language', 'fr');
    expect(getLanguage()).toBe('en');
  });
});

describe('notification preferences', () => {
  it('default to on for both keys', () => {
    expect(getNotificationPref('tripReminders')).toBe(true);
    expect(getNotificationPref('sharingUpdates')).toBe(true);
  });

  it('persists a value turned off', () => {
    setNotificationPref('tripReminders', false);
    expect(getNotificationPref('tripReminders')).toBe(false);
    expect(getNotificationPref('sharingUpdates')).toBe(true);
  });

  it('persists a value explicitly turned back on', () => {
    setNotificationPref('sharingUpdates', false);
    setNotificationPref('sharingUpdates', true);
    expect(getNotificationPref('sharingUpdates')).toBe(true);
  });
});
