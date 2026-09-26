import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTrip, type UpdateTripResult } from './useTrip';
import { assertExists, UpdateAbortedError } from '../../../shared/lib/updateTripAbort';
import type { ChecklistItem } from '../../checklist/types';
import type { Trip } from '../types';

/**
 * Phase 4.4B — mandatory two-session concurrency suite. Two independently
 * instantiated useTrip hooks share ONE fake repository (a single in-memory
 * `store`, standing in for localStorage/Supabase), modeling two real
 * browser tabs/devices editing the same trip rather than one hook's own
 * same-tab write queue (see useTrip.test.ts for that).
 *
 * Deliberately no setTimeout/fake-timer races: every scenario here is
 * ordered deterministically (A's write fully resolves before B's starts, or
 * vice versa) — the one residual millisecond read-then-write race Phase
 * 4.4A/4.4B explicitly accept is NOT something a reliable test can pin down,
 * and isn't what these tests are for.
 */

// getFullTripFn/saveTripFn must be STABLE references across every call to
// useTripsContext() — useTrip.ts depends on them in a useEffect/useCallback
// dependency array, so a mock that hands back a fresh closure on every call
// (e.g. an inline arrow defined inside the factory) makes those effects
// re-fire every render and the hook never settles.
const { store, showToastMock, getFullTripSpy, getFullTripFn, saveTripFn } = vi.hoisted(() => {
  function jsonClone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }
  const store: { current: Trip | null } = { current: null };
  const getFullTripSpy = vi.fn();
  const getFullTripFn = async (id: string) => {
    getFullTripSpy(id);
    return store.current && store.current.id === id ? jsonClone(store.current) : null;
  };
  const saveTripFn = async (trip: Trip) => {
    store.current = jsonClone(trip);
  };
  return { store, showToastMock: vi.fn(), getFullTripSpy, getFullTripFn, saveTripFn };
});

vi.mock('../../../app/providers/TripsProvider', () => ({
  useTripsContext: () => ({ getFullTrip: getFullTripFn, saveTrip: saveTripFn }),
}));
vi.mock('../../../app/providers/ToastProvider', () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

function makeItem(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return { id: 'x', travelerId: 't', text: 'Item X', category: 'misc', quantity: 1, done: false, ...overrides };
}

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: 'Trip',
    homeCurrency: 'EUR',
    archived: false,
    travelers: [],
    legs: [],
    flights: [],
    stays: [],
    bookingItems: [],
    documents: [],
    itineraryStops: [],
    ideas: [],
    budgetCategories: [],
    rememberedLocations: [],
    expenses: [],
    checklistItems: [],
    shareSettings: { enabled: false, includedTabs: [] },
    schemaVersion: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Trip;
}

beforeEach(() => {
  store.current = null;
  showToastMock.mockClear();
  getFullTripSpy.mockClear();
});

async function renderTwoSessions() {
  const a = renderHook(() => useTrip('t1'));
  const b = renderHook(() => useTrip('t1'));
  await waitFor(() => expect(a.result.current.trip).not.toBeNull());
  await waitFor(() => expect(b.result.current.trip).not.toBeNull());
  return { a, b };
}

describe('useTrip — two-session concurrency (Phase 4.4B)', () => {
  it('TEST 1: A adds X, B adds Y — both survive', async () => {
    store.current = makeTrip({ checklistItems: [] });
    const { a, b } = await renderTwoSessions();
    const itemX = makeItem({ id: 'x' });
    const itemY = makeItem({ id: 'y', text: 'Item Y' });

    await act(async () => {
      await a.result.current.updateTrip((t) => ({ ...t, checklistItems: [...t.checklistItems, itemX] }));
    });
    await act(async () => {
      await b.result.current.updateTrip((t) => ({ ...t, checklistItems: [...t.checklistItems, itemY] }));
    });

    expect(store.current!.checklistItems.map((i) => i.id).sort()).toEqual(['x', 'y']);
  });

  it("TEST 2: A deletes X, B (stale) tries to edit X — X stays deleted, and B's edit fails recoverably instead of resurrecting it", async () => {
    store.current = makeTrip({ checklistItems: [makeItem({ id: 'x' })] });
    const { a, b } = await renderTwoSessions();

    await act(async () => {
      await a.result.current.updateTrip((t) => ({ ...t, checklistItems: t.checklistItems.filter((i) => i.id !== 'x') }));
    });
    expect(store.current!.checklistItems).toEqual([]);

    // B still thinks X exists (its own tripRef is stale from before A's
    // delete) and tries to edit it.
    let result!: UpdateTripResult;
    await act(async () => {
      result = await b.result.current.updateTrip((t) => {
        assertExists(t.checklistItems, 'x', 'This item was already deleted elsewhere.');
        return { ...t, checklistItems: t.checklistItems.map((i) => (i.id === 'x' ? { ...i, done: true } : i)) };
      });
    });

    expect(result.ok).toBe(false);
    expect(store.current!.checklistItems).toEqual([]); // never resurrected
    expect(showToastMock).toHaveBeenCalledWith('This item was already deleted elsewhere.', expect.anything());
    // B's own local view catches up to reality instead of staying stale.
    expect(b.result.current.trip?.checklistItems).toEqual([]);
  });

  it('TEST 3: A deletes X, B adds Y, A undoes the delete — X and Y both end up present', async () => {
    store.current = makeTrip({ checklistItems: [makeItem({ id: 'x' })] });
    const { a, b } = await renderTwoSessions();

    let snapshot: ChecklistItem | undefined;
    await act(async () => {
      await a.result.current.updateTrip((t) => {
        snapshot = t.checklistItems.find((i) => i.id === 'x');
        return { ...t, checklistItems: t.checklistItems.filter((i) => i.id !== 'x') };
      });
    });

    const itemY = makeItem({ id: 'y', text: 'Item Y' });
    await act(async () => {
      await b.result.current.updateTrip((t) => ({ ...t, checklistItems: [...t.checklistItems, itemY] }));
    });
    expect(store.current!.checklistItems.map((i) => i.id)).toEqual(['y']);

    // A's Undo must restore X against the FRESH trip (which now has Y from
    // B), never a stale array captured before B's add — otherwise Y would
    // be silently dropped.
    await act(async () => {
      await a.result.current.updateTrip((t) => ({ ...t, checklistItems: [...t.checklistItems, snapshot!] }));
    });

    expect(store.current!.checklistItems.map((i) => i.id).sort()).toEqual(['x', 'y']);
  });

  it('TEST 4: A deletes the whole trip, B (stale) attempts a save — the trip is never resurrected', async () => {
    store.current = makeTrip();
    // Both sessions must exist, per the two-session model — A's delete is
    // modeled directly on the "server" below (deleteTrip is a separate
    // TripsContext operation from updateTrip, out of scope for this file).
    const { b } = await renderTwoSessions();

    store.current = null;

    let result!: UpdateTripResult;
    await act(async () => {
      result = await b.result.current.updateTrip((t) => ({ ...t, title: 'Renamed by B' }));
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ reason: 'trip-deleted' });
    expect(store.current).toBeNull(); // still gone — never recreated
    expect(b.result.current.trip).toBeNull(); // B's screen sees it's gone too
    expect(showToastMock).toHaveBeenCalledWith('This trip was deleted.', expect.objectContaining({ variant: 'error' }));
  });

  it('TEST 5: A updates flight X, B updates unrelated stay Y — both survive', async () => {
    store.current = makeTrip({
      flights: [{ id: 'flightX', airline: 'A', flightNumber: '1', depAirport: 'ATH', depDate: '2026-09-05', depTime: '10:00', arrAirport: 'FCO', arrDate: '2026-09-05', arrTime: '12:00', status: 'scheduled' }],
      stays: [{ id: 'stayY', name: 'Hotel', address: 'Rome', checkinDate: '2026-09-05', checkinTime: '15:00', checkoutDate: '2026-09-08', checkoutTime: '11:00' }],
    });
    const { a, b } = await renderTwoSessions();

    await act(async () => {
      await a.result.current.updateTrip((t) => ({ ...t, flights: t.flights.map((f) => (f.id === 'flightX' ? { ...f, status: 'delayed' } : f)) }));
    });
    await act(async () => {
      await b.result.current.updateTrip((t) => ({ ...t, stays: t.stays.map((s) => (s.id === 'stayY' ? { ...s, name: 'Renamed Hotel' } : s)) }));
    });

    expect(store.current!.flights[0]!.status).toBe('delayed');
    expect(store.current!.stays[0]!.name).toBe('Renamed Hotel');
  });

  it('TEST 6: undo refuses to restore an item when another session already recreated the same id — no overwrite, no duplicate', async () => {
    store.current = makeTrip({ checklistItems: [makeItem({ id: 'x', text: 'Original' })] });
    const { a, b } = await renderTwoSessions();

    let snapshot: ChecklistItem | undefined;
    await act(async () => {
      await a.result.current.updateTrip((t) => {
        snapshot = t.checklistItems.find((i) => i.id === 'x');
        return { ...t, checklistItems: t.checklistItems.filter((i) => i.id !== 'x') };
      });
    });

    const recreated = makeItem({ id: 'x', text: 'Recreated by B' });
    await act(async () => {
      await b.result.current.updateTrip((t) => ({ ...t, checklistItems: [...t.checklistItems, recreated] }));
    });

    let result!: UpdateTripResult;
    await act(async () => {
      result = await a.result.current.updateTrip((t) => {
        if (t.checklistItems.some((i) => i.id === snapshot!.id)) {
          throw new UpdateAbortedError("Couldn't undo — this item already exists.", 'neutral');
        }
        return { ...t, checklistItems: [...t.checklistItems, snapshot!] };
      });
    });

    expect(result.ok).toBe(false);
    // Recreated-by-B survives untouched — not overwritten or duplicated by A's stale snapshot.
    expect(store.current!.checklistItems).toEqual([recreated]);
    expect(showToastMock).toHaveBeenCalledWith("Couldn't undo — this item already exists.", expect.anything());
  });

  it('TEST 7: rapid same-tab updateTrip calls still serialize correctly against this shared fake repository (regression — see also useTrip.test.ts)', async () => {
    store.current = makeTrip({ checklistItems: [makeItem({ id: 'x' })] });
    const { a } = await renderTwoSessions();

    let first!: Promise<UpdateTripResult>;
    let second!: Promise<UpdateTripResult>;
    act(() => {
      first = a.result.current.updateTrip((t) => ({ ...t, checklistItems: t.checklistItems.map((i) => (i.id === 'x' ? { ...i, done: true } : i)) }));
      second = a.result.current.updateTrip((t) => ({ ...t, checklistItems: [...t.checklistItems, makeItem({ id: 'y', text: 'Item Y' })] }));
    });
    await act(async () => {
      await Promise.all([first, second]);
    });

    expect(store.current!.checklistItems.find((i) => i.id === 'x')!.done).toBe(true);
    expect(store.current!.checklistItems.some((i) => i.id === 'y')).toBe(true);
  });

  it('TEST 8: a single updateTrip call fetches exactly one fresh snapshot, shared by both validation and mutation', async () => {
    store.current = makeTrip({ checklistItems: [makeItem({ id: 'x', done: false })] });
    const { a } = await renderTwoSessions();
    getFullTripSpy.mockClear(); // ignore the mount-time fetches for both hooks

    let result!: UpdateTripResult;
    await act(async () => {
      result = await a.result.current.updateTrip((t) => {
        // "Validation": rejects if already done — reads the exact same
        // fresh `t` the mutation below applies to; no second read exists to
        // race against this one.
        if (t.checklistItems.find((i) => i.id === 'x')!.done) {
          throw new UpdateAbortedError('Already done.', 'warn');
        }
        return { ...t, checklistItems: t.checklistItems.map((i) => (i.id === 'x' ? { ...i, done: true } : i)) };
      });
    });

    expect(result.ok).toBe(true);
    expect(getFullTripSpy).toHaveBeenCalledTimes(1);
  });
});
