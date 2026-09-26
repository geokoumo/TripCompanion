import { describe, expect, it, vi } from 'vitest';
import { saveTripPatch } from './saveTripPatch';
import { UpdateAbortedError } from '../../../shared/lib/updateTripAbort';
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
  it('A: a concurrent, unrelated field change survives — the patch only touches what it names', async () => {
    // By the time this call's fresh read resolves, another tab/device has
    // already added an expense. The patch only touches `description`.
    const fresh = makeTrip({
      description: undefined,
      expenses: [{ id: 'e1', amount: 10, currency: 'EUR', categoryId: 'c1', date: '2026-01-02', paidBy: 't1', splitAmong: ['t1'] }] as Trip['expenses'],
    });
    const getFullTrip = vi.fn().mockResolvedValue(fresh);
    const onSave = vi.fn().mockResolvedValue(undefined);

    await saveTripPatch('t1', { description: 'A week in Rome' }, getFullTrip, onSave);

    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0]![0] as Trip;
    expect(saved.description).toBe('A week in Rome');
    expect(saved.expenses).toEqual(fresh.expenses); // the concurrent expense survives
  });

  it('B: concurrent edits to two different metadata fields are both preserved', async () => {
    // Simulates: Tab B already saved `archived: true` (visible in `fresh`);
    // this call is Tab A's concurrent edit to `description`. Both must
    // appear in the final saved object.
    const fresh = makeTrip({ archived: true, description: undefined });
    const getFullTrip = vi.fn().mockResolvedValue(fresh);
    const onSave = vi.fn().mockResolvedValue(undefined);

    await saveTripPatch('t1', { description: 'Updated' }, getFullTrip, onSave);

    const saved = onSave.mock.calls[0]![0] as Trip;
    expect(saved.archived).toBe(true); // Tab B's concurrent change survives
    expect(saved.description).toBe('Updated'); // this call's own change applies
  });

  it('C: normal single-user editing (no concurrent change) still works exactly as before', async () => {
    const trip = makeTrip({ description: 'Old description' });
    const getFullTrip = vi.fn().mockResolvedValue(trip);
    const onSave = vi.fn().mockResolvedValue(undefined);

    await saveTripPatch('t1', { description: 'New description' }, getFullTrip, onSave);

    const saved = onSave.mock.calls[0]![0] as Trip;
    expect(saved.description).toBe('New description');
    expect(saved.id).toBe('t1');
    expect(saved.homeCurrency).toBe('EUR');
  });

  it('D: a failed save rejects (does not swallow the error) so the caller keeps its own error handling and does not corrupt local state', async () => {
    const trip = makeTrip();
    const getFullTrip = vi.fn().mockResolvedValue(trip);
    const onSave = vi.fn().mockRejectedValue(new Error('save-failed'));

    await expect(saveTripPatch('t1', { description: 'New' }, getFullTrip, onSave)).rejects.toThrow('save-failed');
  });

  it('a function patch derives its values from the fresh trip, not a stale one — correct for a value-dependent toggle', async () => {
    // Tab B already flipped archived to true. A naive `!stale.archived`
    // (using whatever the caller last rendered) would flip it back to true
    // too (a no-op that looks right by luck); the real case that matters is
    // when the fresh value differs from what a stale view assumed, and the
    // patch must react to the ACTUAL current value — which is why this
    // function form is only ever given the fresh trip, never a caller
    // snapshot.
    const fresh = makeTrip({ archived: true });
    const getFullTrip = vi.fn().mockResolvedValue(fresh);
    const onSave = vi.fn().mockResolvedValue(undefined);

    await saveTripPatch('t1', (t) => ({ archived: !t.archived }), getFullTrip, onSave);

    const saved = onSave.mock.calls[0]![0] as Trip;
    expect(saved.archived).toBe(false); // toggled off the FRESH true
  });

  it('returns the fresh trip as read, before the patch was applied, for callers that need the pre-change value', async () => {
    const fresh = makeTrip({ coverPhotoPath: 'user/t1/old.jpg' });
    const getFullTrip = vi.fn().mockResolvedValue(fresh);
    const onSave = vi.fn().mockResolvedValue(undefined);

    const returned = await saveTripPatch('t1', { coverPhotoPath: 'user/t1/new.jpg' }, getFullTrip, onSave);

    expect(returned.coverPhotoPath).toBe('user/t1/old.jpg');
  });

  /**
   * Phase 4.4C — saveTripPatch must tell "the trip is confirmed gone" apart
   * from "the fresh read failed and the trip's real state is unknown."
   * Neither case may fall back to a stale aggregate and save it — that was
   * the resurrection bug this phase closes (see TripsProvider.
   * getFullTripOrThrow, the non-swallowing sibling of getFullTrip that every
   * saveTripPatch caller now uses). This block supersedes the old "C2" test,
   * which asserted the now-removed stale-fallback behavior.
   */
  describe('Phase 4.4C — confirmed missing vs read failure', () => {
    it('TEST A: trip exists, fresh read succeeds — the patch saves normally', async () => {
      const fresh = makeTrip({ description: 'Old' });
      const getFullTrip = vi.fn().mockResolvedValue(fresh);
      const onSave = vi.fn().mockResolvedValue(undefined);

      const returned = await saveTripPatch('t1', { description: 'New' }, getFullTrip, onSave);

      expect(onSave).toHaveBeenCalledTimes(1);
      expect((onSave.mock.calls[0]![0] as Trip).description).toBe('New');
      expect(returned.description).toBe('Old');
    });

    it('TEST B: the trip was deleted by another session — the fresh read confirms it is missing (resolves null), so the patch aborts without ever calling saveTrip or resurrecting it', async () => {
      const getFullTrip = vi.fn().mockResolvedValue(null); // repository-confirmed: no such trip
      const onSave = vi.fn().mockResolvedValue(undefined);

      await expect(saveTripPatch('t1', { description: 'New' }, getFullTrip, onSave)).rejects.toThrow(UpdateAbortedError);

      expect(onSave).not.toHaveBeenCalled();
      try {
        await saveTripPatch('t1', { description: 'New' }, getFullTrip, onSave);
      } catch (err) {
        expect(err).toBeInstanceOf(UpdateAbortedError);
        expect((err as UpdateAbortedError).message).toBe('This trip was deleted.');
        expect((err as UpdateAbortedError).variant).toBe('error');
      }
      expect(onSave).not.toHaveBeenCalled();
    });

    it("TEST C: the fresh read fails transiently (network/read error) — the patch does NOT fall back to a stale copy, does NOT call saveTrip, and surfaces an ordinary recoverable error rather than claiming the trip was deleted", async () => {
      const getFullTrip = vi.fn().mockRejectedValue(new Error('network-timeout'));
      const onSave = vi.fn().mockResolvedValue(undefined);

      const rejection = saveTripPatch('t1', { description: 'New' }, getFullTrip, onSave);
      await expect(rejection).rejects.toThrow('network-timeout');
      await expect(rejection).rejects.not.toBeInstanceOf(UpdateAbortedError);
      expect(onSave).not.toHaveBeenCalled();
    });

    it('TEST D (supersedes old C2): a resolved null is never treated as "use the trip I already have" — it is always a confirmed-missing abort, never a silent stale save', async () => {
      const getFullTrip = vi.fn().mockResolvedValue(null);
      const onSave = vi.fn().mockResolvedValue(undefined);

      await expect(saveTripPatch('t1', { description: 'New' }, getFullTrip, onSave)).rejects.toThrow('This trip was deleted.');
      expect(onSave).not.toHaveBeenCalled();
    });

    it('TEST E: LocalStorage-shaped and Supabase-shaped repository fakes are handled identically — both distinguish confirmed-missing (resolve null) from read failure (throw), never conflating the two', async () => {
      // Mirrors LocalStorageTripRepository.getTrip: no matching record ->
      // null; a corrupted/unparseable record -> throws (never returns null
      // for that case in a way that could be confused with "not found").
      const localStorageShaped = {
        missing: async (_id: string) => null,
        corrupted: async (_id: string): Promise<Trip | null> => {
          throw new Error('local-storage-corrupted');
        },
      };
      // Mirrors SupabaseTripRepository.getTrip: `if (error) throw error; if
      // (!data) return null;` — same confirmed-missing/read-failure split.
      const supabaseShaped = {
        missing: async (_id: string) => null,
        readFailed: async (_id: string): Promise<Trip | null> => {
          throw new Error('network error');
        },
      };
      const onSave = vi.fn().mockResolvedValue(undefined);

      for (const getFullTrip of [localStorageShaped.missing, supabaseShaped.missing]) {
        onSave.mockClear();
        await expect(saveTripPatch('t1', { description: 'New' }, getFullTrip, onSave)).rejects.toThrow('This trip was deleted.');
        expect(onSave).not.toHaveBeenCalled();
      }

      for (const getFullTrip of [localStorageShaped.corrupted, supabaseShaped.readFailed]) {
        onSave.mockClear();
        const rejection = saveTripPatch('t1', { description: 'New' }, getFullTrip, onSave);
        await expect(rejection).rejects.not.toBeInstanceOf(UpdateAbortedError);
        expect(onSave).not.toHaveBeenCalled();
      }
    });
  });
});
