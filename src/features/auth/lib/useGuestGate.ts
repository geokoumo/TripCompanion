import { useEffect, useState } from 'react';
import { getPersistedGuestChoice, setPersistedGuestChoice } from './guestSession';

/**
 * Tracks whether the sign-in gate should be bypassed because this device
 * previously chose "Continue without an account" — persisted across
 * refreshes (see guestSession.ts) but cleared the instant a real Supabase
 * session is present (sign-in, or session restoration on load), so the
 * bypass can never survive into a later sign-out.
 */
export function useGuestGate(user: unknown): { continuingLocally: boolean; setContinuingLocally: (value: boolean) => void } {
  const [continuingLocally, setContinuingLocallyState] = useState(getPersistedGuestChoice);

  const setContinuingLocally = (value: boolean) => {
    setContinuingLocallyState(value);
    setPersistedGuestChoice(value);
  };

  useEffect(() => {
    if (user) {
      setContinuingLocallyState(false);
      setPersistedGuestChoice(false);
    }
  }, [user]);

  return { continuingLocally, setContinuingLocally };
}
