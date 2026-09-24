import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTrip } from './useTrip';
import type { Trip } from '../types';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
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
    checklistItems: [
      { id: 'a', travelerId: 't', text: 'A', category: 'x', quantity: 1, done: false },
      { id: 'b', travelerId: 't', text: 'B', category: 'x', quantity: 1, done: false },
    ],
    shareSettings: { enabled: false, includedTabs: [] },
    schemaVersion: 2,
    createdAt: new Date().toISOString(),
    ...overrides,
  } as Trip;
}

const getFullTripMock = vi.fn();
const saveTripMock = vi.fn();
vi.mock('../../../app/providers/TripsProvider', () => ({
  useTripsContext: () => ({ getFullTrip: getFullTripMock, saveTrip: saveTripMock }),
}));

describe('useTrip — concurrent updateTrip calls', () => {
  it("does not let a second in-flight updateTrip silently overwrite the first one's change (stale-base race)", async () => {
    const initial = makeTrip();
    getFullTripMock.mockResolvedValue(initial);

    // Simulates real save latency (e.g. a Supabase round trip): each call
    // gets its own controllable promise so more than one can be "in flight"
    // at once, same as a real network write would be.
    const pending: ReturnType<typeof deferred<void>>[] = [];
    saveTripMock.mockImplementation(() => {
      const d = deferred<void>();
      pending.push(d);
      return d.promise;
    });

    const { result } = renderHook(() => useTrip('t1'));
    await waitFor(() => expect(result.current.trip).not.toBeNull());

    // Two independent actions fired back to back with neither awaited before
    // the next starts — exactly how a fire-and-forget updateTrip call from a
    // click handler is actually invoked (e.g. ChecklistTab's toggle()).
    let firstDone!: Promise<void>;
    let secondDone!: Promise<void>;
    act(() => {
      firstDone = result.current.updateTrip((t) => ({
        ...t,
        checklistItems: t.checklistItems.map((i) => (i.id === 'a' ? { ...i, done: true } : i)),
      }));
      secondDone = result.current.updateTrip((t) => ({
        ...t,
        checklistItems: t.checklistItems.map((i) => (i.id === 'b' ? { ...i, done: true } : i)),
      }));
    });

    let settled = false;
    void Promise.all([firstDone, secondDone]).then(() => {
      settled = true;
    });
    // Resolve whatever save calls have been made so far, in rounds, until
    // both operations have actually settled — works whether the
    // implementation fires both saves immediately or serializes them.
    for (let round = 0; round < 10 && !settled; round++) {
      await act(async () => {
        const toResolve = pending.splice(0, pending.length);
        for (const d of toResolve) d.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });
    }

    expect(settled).toBe(true);
    const finalTrip = saveTripMock.mock.calls.at(-1)![0] as Trip;
    expect(finalTrip.checklistItems.find((i) => i.id === 'a')!.done).toBe(true);
    expect(finalTrip.checklistItems.find((i) => i.id === 'b')!.done).toBe(true);
  });

  it('lets a queued updateTrip proceed even after an earlier one in the same queue failed', async () => {
    const initial = makeTrip();
    getFullTripMock.mockResolvedValue(initial);
    saveTripMock.mockRejectedValueOnce(new Error('save-failed')).mockResolvedValue(undefined);

    const { result } = renderHook(() => useTrip('t1'));
    await waitFor(() => expect(result.current.trip).not.toBeNull());

    let firstDone!: Promise<void>;
    let secondDone!: Promise<void>;
    act(() => {
      firstDone = result.current.updateTrip((t) => ({
        ...t,
        checklistItems: t.checklistItems.map((i) => (i.id === 'a' ? { ...i, done: true } : i)),
      }));
      secondDone = result.current.updateTrip((t) => ({
        ...t,
        checklistItems: t.checklistItems.map((i) => (i.id === 'b' ? { ...i, done: true } : i)),
      }));
    });

    await expect(firstDone).rejects.toThrow('save-failed');
    await act(async () => {
      await secondDone;
    });

    // The second write still went through, and — since it's applied on top
    // of the trip as it was before the first (failed) write — still carries
    // b's change, proving the queue moved on rather than jamming.
    const finalTrip = saveTripMock.mock.calls.at(-1)![0] as Trip;
    expect(finalTrip.checklistItems.find((i) => i.id === 'b')!.done).toBe(true);
  });
});
