import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSiteUrl } from './siteUrl';

describe('getSiteUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses VITE_SITE_URL when configured, regardless of the current origin', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://trip-companion-sepia-two.vercel.app');
    expect(getSiteUrl()).toBe('https://trip-companion-sepia-two.vercel.app');
  });

  it('strips a trailing slash from the configured value', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://trip-companion-sepia-two.vercel.app/');
    expect(getSiteUrl()).toBe('https://trip-companion-sepia-two.vercel.app');
  });

  it('falls back to window.location.origin when unset — the local-dev case', () => {
    vi.stubEnv('VITE_SITE_URL', '');
    expect(getSiteUrl()).toBe(window.location.origin);
  });

  it('falls back to window.location.origin when set to only whitespace', () => {
    vi.stubEnv('VITE_SITE_URL', '   ');
    expect(getSiteUrl()).toBe(window.location.origin);
  });
});
