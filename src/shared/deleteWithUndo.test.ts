import { describe, expect, it, vi } from 'vitest';
import { deleteEntityWithUndo } from './lib/deleteWithUndo';
import type { Trip } from '../features/trips/types';

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
