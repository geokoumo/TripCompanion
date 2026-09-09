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
});
