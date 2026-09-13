import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { getPersistedGuestChoice } from './guestSession';
import { useGuestGate } from './useGuestGate';

describe('useGuestGate', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with the gate not bypassed on a fresh device', () => {
    const { result } = renderHook(() => useGuestGate(null));
    expect(result.current.continuingLocally).toBe(false);
  });

  it('choosing "continue without an account" bypasses the gate and persists the choice', () => {
    const { result } = renderHook(() => useGuestGate(null));
    act(() => result.current.setContinuingLocally(true));
    expect(result.current.continuingLocally).toBe(true);
    expect(getPersistedGuestChoice()).toBe(true);
  });

  it('REFRESH: a fresh mount reads the previously persisted choice instead of resetting to the gate', () => {
    const first = renderHook(() => useGuestGate(null));
    act(() => first.result.current.setContinuingLocally(true));
    first.unmount();

    // A page refresh is, from React's point of view, a brand new mount with
    // no prior in-memory state — only what's in storage carries over.
    const afterRefresh = renderHook(() => useGuestGate(null));
    expect(afterRefresh.result.current.continuingLocally).toBe(true);
  });

  it('SESSION RESTORATION: a real user appearing clears the bypass, in memory and in storage', () => {
    const { result, rerender } = renderHook(({ user }: { user: unknown }) => useGuestGate(user), {
      initialProps: { user: null as unknown },
    });
    act(() => result.current.setContinuingLocally(true));
    expect(getPersistedGuestChoice()).toBe(true);

    rerender({ user: { id: 'u1' } });

    expect(result.current.continuingLocally).toBe(false);
    expect(getPersistedGuestChoice()).toBe(false);
  });

  it('a device that later signs out lands back on the real gate, not a stale guest bypass', () => {
    const { result, rerender } = renderHook(({ user }: { user: unknown }) => useGuestGate(user), {
      initialProps: { user: null as unknown },
    });
    act(() => result.current.setContinuingLocally(true));

    rerender({ user: { id: 'u1' } }); // signs in
    rerender({ user: null }); // signs out later

    expect(result.current.continuingLocally).toBe(false);
    expect(getPersistedGuestChoice()).toBe(false);
  });
});
