import { describe, expect, it, vi } from 'vitest';
import { deleteEntityWithUndo } from './lib/deleteWithUndo';
import { UpdateAbortedError } from './lib/updateTripAbort';
import type { Trip } from '../features/trips/types';

/** Mimics useTrip.updateTrip's own UpdateAbortedError handling (see useTrip.ts) closely enough to exercise deleteEntityWithUndo's abort paths without pulling in the whole hook — including showing the abort toast itself, exactly like the real hook does. */
function fakeUpdateTrip(getTrip: () => Trip, setTrip: (t: Trip) => void, showToast: (text: string, options?: unknown) => void) {
  return vi.fn(async (updater: (t: Trip) => Trip) => {
    try {
      const next = updater(getTrip());
      setTrip(next);
      return { ok: true as const };
    } catch (err) {
      if (err instanceof UpdateAbortedError) {
        showToast(err.message, { variant: err.variant });
        return { ok: false as const, reason: 'aborted' as const, message: err.message };
      }
      throw err;
    }
  });
}

function makeTrip(): Trip {
  return {
    id: 'trip1',
    title: 'Test Trip',
    homeCurrency: 'EUR',
    archived: false,
    description: null,
    travelers: [],
    legs: [],
    flights: [{ id: 'f1', airline: 'A', flightNumber: '1', depAirport: 'ATH', depDate: '2026-09-05', depTime: '10:00', arrAirport: 'FCO', arrDate: '2026-09-05', arrTime: '12:00', status: 'scheduled' }],
    stays: [],
    bookingItems: [],
    documents: [],
    itineraryStops: [],
    ideas: [],
    budgetCategories: [],
    budget: null,
    rememberedLocations: [],
    expenses: [],
    checklistItems: [],
    shareSettings: { enabled: false, includedTabs: [] },
    schemaVersion: 2,
    createdAt: '2026-09-01',
  };
}

describe('deleteEntityWithUndo', () => {
  it('removes the item from the trip and shows an undo toast', async () => {
    let trip = makeTrip();
    const updateTrip = vi.fn(async (updater: (t: Trip) => Trip) => {
      trip = updater(trip);
    });
    const showToast = vi.fn();

    deleteEntityWithUndo({ updateTrip, showToast, arrayKey: 'flights', id: 'f1' });
    await vi.waitFor(() => expect(updateTrip).toHaveBeenCalledTimes(1));

    expect(trip.flights).toEqual([]);
    expect(showToast).toHaveBeenCalledWith('Deleted.', expect.objectContaining({ variant: 'neutral', action: expect.objectContaining({ label: 'Undo' }) }));
  });

  it('restores the exact deleted item when the undo action is invoked', async () => {
    let trip = makeTrip();
    const original = trip.flights[0]!;
    const updateTrip = vi.fn(async (updater: (t: Trip) => Trip) => {
      trip = updater(trip);
    });
    const showToast = vi.fn();

    deleteEntityWithUndo({ updateTrip, showToast, arrayKey: 'flights', id: 'f1' });
    await vi.waitFor(() => expect(updateTrip).toHaveBeenCalledTimes(1));
    expect(trip.flights).toEqual([]);

    const [, options] = showToast.mock.calls[0]!;
    options.action.onClick();
    await vi.waitFor(() => expect(updateTrip).toHaveBeenCalledTimes(2));

    expect(trip.flights).toEqual([original]);
  });

  it('deleting a target that is already gone (deleted elsewhere) shows a lightweight message, not the normal Deleted./Undo toast', async () => {
    let trip = makeTrip();
    const showToast = vi.fn();
    const updateTrip = fakeUpdateTrip(
      () => trip,
      (t) => {
        trip = t;
      },
      showToast,
    );

    // 'nope' doesn't exist on this trip's flights — simulates another
    // session having already deleted it before this one got here.
    deleteEntityWithUndo({ updateTrip, showToast, arrayKey: 'flights', id: 'nope' });
    await vi.waitFor(() => expect(updateTrip).toHaveBeenCalledTimes(1));

    expect(showToast).toHaveBeenCalledWith('Already deleted elsewhere.', expect.anything());
    expect(showToast).not.toHaveBeenCalledWith('Deleted.', expect.anything());
    // The trip itself is untouched — nothing here to filter out.
    expect(trip.flights).toHaveLength(1);
  });

  it('undo refuses to restore an item when another session already recreated the same id, instead of duplicating or overwriting it', async () => {
    let trip = makeTrip();
    const showToast = vi.fn();
    const updateTrip = fakeUpdateTrip(
      () => trip,
      (t) => {
        trip = t;
      },
      showToast,
    );

    deleteEntityWithUndo({ updateTrip, showToast, arrayKey: 'flights', id: 'f1' });
    await vi.waitFor(() => expect(updateTrip).toHaveBeenCalledTimes(1));
    expect(trip.flights).toEqual([]);

    // Another session recreates an entity with the same id while the undo
    // toast is still up.
    trip = { ...trip, flights: [{ id: 'f1', airline: 'B', flightNumber: '2', depAirport: 'XYZ', depDate: '2026-09-06', depTime: '09:00', arrAirport: 'ABC', arrDate: '2026-09-06', arrTime: '11:00', status: 'scheduled' }] };

    const [, options] = showToast.mock.calls[0]!;
    options.action.onClick();
    await vi.waitFor(() => expect(updateTrip).toHaveBeenCalledTimes(2));

    expect(showToast).toHaveBeenCalledWith("Couldn't undo — this item already exists.", expect.anything());
    // The recreated flight (airline 'B') survives untouched — not
    // overwritten or duplicated by the stale snapshot (airline 'A').
    expect(trip.flights).toHaveLength(1);
    expect(trip.flights[0]!.airline).toBe('B');
  });

  it('uses a custom deleted message when one is given', async () => {
    let trip = makeTrip();
    const updateTrip = vi.fn(async (updater: (t: Trip) => Trip) => {
      trip = updater(trip);
    });
    const showToast = vi.fn();

    deleteEntityWithUndo({ updateTrip, showToast, arrayKey: 'flights', id: 'f1', deletedMessage: 'Flight removed.' });
    await vi.waitFor(() => expect(showToast).toHaveBeenCalled());

    expect(showToast).toHaveBeenCalledWith('Flight removed.', expect.anything());
  });

  // Item F: deleting an entity that has attachments must preserve the
  // document (never delete it) while clearing its stale relatedTo, since
  // the deleted entity's own View Details — the only place the old label
  // was matched against — no longer exists.
  describe('clearDocumentsRelatedTo (item F: document preservation on delete)', () => {
    function tripWithDoc(): Trip {
      const t = makeTrip();
      return { ...t, documents: [{ id: 'd1', category: 'boarding_pass', title: 'ticket.pdf', relatedTo: 'ATH → FCO flight', fileType: 'pdf', storagePath: 'p', uploadedAt: '2026-09-01' }] };
    }

    it('preserves the document and clears its relatedTo when the source flight is deleted', async () => {
      let trip = tripWithDoc();
      const updateTrip = vi.fn(async (updater: (t: Trip) => Trip) => {
        trip = updater(trip);
      });
      const showToast = vi.fn();

      deleteEntityWithUndo({ updateTrip, showToast, arrayKey: 'flights', id: 'f1', clearDocumentsRelatedTo: 'ATH → FCO flight' });
      await vi.waitFor(() => expect(updateTrip).toHaveBeenCalledTimes(1));

      expect(trip.flights).toEqual([]);
      expect(trip.documents).toHaveLength(1);
      expect(trip.documents[0]!.relatedTo).toBeUndefined();
      expect(trip.documents[0]!.id).toBe('d1');
    });

    it('leaves documents with a different relatedTo untouched', async () => {
      let trip: Trip = { ...tripWithDoc(), documents: [...tripWithDoc().documents, { id: 'd2', category: 'other', title: 'unrelated.pdf', relatedTo: 'Some Hotel', fileType: 'pdf', storagePath: 'p2', uploadedAt: '2026-09-01' }] };
      const updateTrip = vi.fn(async (updater: (t: Trip) => Trip) => {
        trip = updater(trip);
      });
      const showToast = vi.fn();

      deleteEntityWithUndo({ updateTrip, showToast, arrayKey: 'flights', id: 'f1', clearDocumentsRelatedTo: 'ATH → FCO flight' });
      await vi.waitFor(() => expect(updateTrip).toHaveBeenCalledTimes(1));

      expect(trip.documents.find((d) => d.id === 'd2')?.relatedTo).toBe('Some Hotel');
    });

    it('re-attaches the detached document to the restored entity when undo is invoked', async () => {
      let trip = tripWithDoc();
      const updateTrip = vi.fn(async (updater: (t: Trip) => Trip) => {
        trip = updater(trip);
      });
      const showToast = vi.fn();

      deleteEntityWithUndo({ updateTrip, showToast, arrayKey: 'flights', id: 'f1', clearDocumentsRelatedTo: 'ATH → FCO flight' });
      await vi.waitFor(() => expect(updateTrip).toHaveBeenCalledTimes(1));
      expect(trip.documents[0]!.relatedTo).toBeUndefined();

      const [, options] = showToast.mock.calls[0]!;
      options.action.onClick();
      await vi.waitFor(() => expect(updateTrip).toHaveBeenCalledTimes(2));

      expect(trip.flights).toHaveLength(1);
      expect(trip.documents[0]!.relatedTo).toBe('ATH → FCO flight');
    });

    it('never deletes the document itself, only its relatedTo tag', async () => {
      let trip = tripWithDoc();
      const updateTrip = vi.fn(async (updater: (t: Trip) => Trip) => {
        trip = updater(trip);
      });
      const showToast = vi.fn();

      deleteEntityWithUndo({ updateTrip, showToast, arrayKey: 'flights', id: 'f1', clearDocumentsRelatedTo: 'ATH → FCO flight' });
      await vi.waitFor(() => expect(updateTrip).toHaveBeenCalledTimes(1));

      expect(trip.documents.map((d) => d.id)).toEqual(['d1']);
    });
  });
});
