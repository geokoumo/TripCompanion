import { beforeEach, describe, expect, it } from 'vitest';
import { getPersistedGuestChoice, setPersistedGuestChoice } from './guestSession';

describe('guestSession', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to false when nothing has been persisted', () => {
    expect(getPersistedGuestChoice()).toBe(false);
  });

  it('persists true and reads it back', () => {
    setPersistedGuestChoice(true);
    expect(getPersistedGuestChoice()).toBe(true);
  });

  it('clears the flag entirely (rather than storing a falsy string) when set back to false', () => {
    setPersistedGuestChoice(true);
    setPersistedGuestChoice(false);
    expect(getPersistedGuestChoice()).toBe(false);
    expect(localStorage.getItem('tripcompanion:continuingLocally')).toBeNull();
  });

  it('uses its own storage key, separate from trip data', () => {
    setPersistedGuestChoice(true);
    expect(localStorage.getItem('tripcompanion:trips')).toBeNull();
  });
});
