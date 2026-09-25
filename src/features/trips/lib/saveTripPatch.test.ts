import { describe, expect, it, vi } from 'vitest';
import { saveTripPatch } from './saveTripPatch';
import type { Trip } from '../types';

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: 'Trip',
    homeCurrency: 'EUR',
    archived: false,
    description: undefined,
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

describe('saveTripPatch', () => {
  it('A: a stale edit does not overwrite a newer, unrelated field a concurrent save already changed', async () => {
    // The caller opened its sheet against `stale` (no expenses yet). By the
    // time it saves, `fresh` (what getFullTrip now returns) has an expense
    // added by another tab/device. The patch only touches `description`.
    const stale = makeTrip({ description: undefined, expenses: [] });
    const fresh = makeTrip({
      description: undefined,
      expenses: [{ id: 'e1', amount: 10, currency: 'EUR', categoryId: 'c1', date: '2026-01-02', paidBy: 't1', splitAmong: ['t1'] }] as Trip['expenses'],
    });
    const getFullTrip = vi.fn().mockResolvedValue(fresh);
    const onSave = vi.fn().mockResolvedValue(undefined);

    await saveTripPatch('t1', stale, { description: 'A week in Rome' }, getFullTrip, onSave);

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0]![0] as Trip;
    expect(saved.description).toBe('A week in Rome');
    expect(saved.expenses).toEqual(fresh.expenses); // the concurrent expense survives
  });

  it('B: concurrent edits to two different metadata fields are both preserved', async () => {
    // Simulates: Tab B already saved `archived: true` (visible in `fresh`);
    // this call is Tab A's concurrent edit to `description`. Both must
    // appear in the final saved object.
    const stale = makeTrip({ archived: false, description: undefined });
    const fresh = makeTrip({ archived: true, description: undefined });
    const getFullTrip = vi.fn().mockResolvedValue(fresh);
    const onSave = vi.fn().mockResolvedValue(undefined);

    await saveTripPatch('t1', stale, { description: 'Updated' }, getFullTrip, onSave);

    const saved = onSave.mock.calls[0]![0] as Trip;
    expect(saved.archived).toBe(true); // Tab B's concurrent change survives
    expect(saved.description).toBe('Updated'); // this call's own change applies
  });

  it('C: normal single-user editing (no concurrent change) still works exactly as before', async () => {
    const trip = makeTrip({ description: 'Old description' });
    const getFullTrip = vi.fn().mockResolvedValue(trip);
    const onSave = vi.fn().mockResolvedValue(undefined);

    await saveTripPatch('t1', trip, { description: 'New description' }, getFullTrip, onSave);

    const saved = onSave.mock.calls[0]![0] as Trip;
    expect(saved.description).toBe('New description');
    expect(saved.id).toBe('t1');
    expect(saved.homeCurrency).toBe('EUR');
  });

  it('C2: falls back to the caller-supplied trip when getFullTrip cannot resolve a fresher copy', async () => {
    const trip = makeTrip({ description: 'Old' });
    const getFullTrip = vi.fn().mockResolvedValue(null);
    const onSave = vi.fn().mockResolvedValue(undefined);

    await saveTripPatch('t1', trip, { description: 'New' }, getFullTrip, onSave);

    const saved = onSave.mock.calls[0]![0] as Trip;
    expect(saved.description).toBe('New');
    expect(saved.title).toBe('Trip');
  });

  it('D: a failed save rejects (does not swallow the error) so the caller keeps its own error handling and does not corrupt local state', async () => {
    const trip = makeTrip();
    const getFullTrip = vi.fn().mockResolvedValue(trip);
    const onSave = vi.fn().mockRejectedValue(new Error('save-failed'));

    await expect(saveTripPatch('t1', trip, { description: 'New' }, getFullTrip, onSave)).rejects.toThrow('save-failed');
  });

  it('a function patch derives its values from the fresh trip, not the stale one — correct for a value-dependent toggle', async () => {
    // Tab B already flipped archived to true; this call's own (stale) view
    // still thinks it's false. A naive `!stale.archived` would flip it back
    // to true too (a no-op that looks right by luck); the real case that
    // matters is when the fresh value differs from what the stale trip
    // assumed, and the patch must react to the ACTUAL current value.
    const stale = makeTrip({ archived: false });
    const fresh = makeTrip({ archived: true });
    const getFullTrip = vi.fn().mockResolvedValue(fresh);
    const onSave = vi.fn().mockResolvedValue(undefined);

    await saveTripPatch('t1', stale, (t) => ({ archived: !t.archived }), getFullTrip, onSave);

    const saved = onSave.mock.calls[0]![0] as Trip;
    expect(saved.archived).toBe(false); // toggled off the FRESH true, not the stale false
  });

  it('returns the fresh trip as read, before the patch was applied, for callers that need the pre-change value', async () => {
    const stale = makeTrip({ coverPhotoPath: undefined });
    const fresh = makeTrip({ coverPhotoPath: 'user/t1/old.jpg' });
    const getFullTrip = vi.fn().mockResolvedValue(fresh);
    const onSave = vi.fn().mockResolvedValue(undefined);

    const returned = await saveTripPatch('t1', stale, { coverPhotoPath: 'user/t1/new.jpg' }, getFullTrip, onSave);

    expect(returned.coverPhotoPath).toBe('user/t1/old.jpg');
  });
});
