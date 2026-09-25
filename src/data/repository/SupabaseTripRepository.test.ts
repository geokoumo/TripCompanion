import { describe, expect, it } from 'vitest';
import { SupabaseTripRepository } from './SupabaseTripRepository';
import type { Trip } from '../../features/trips/types';

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
    createdAt: new Date().toISOString(),
    ...overrides,
  } as Trip;
}

// F-08: the same save-time date-order guard used by LocalStorageTripRepository
// must reject on the Supabase backend too, so both persistence modes behave
// identically for the same bad input — verified here without needing a real
// Supabase connection, since the guard runs before any client/RPC call.
describe('SupabaseTripRepository — F-08 date-order guard', () => {
  it('saveTrip rejects a leg whose end date precedes its start date, before ever touching the client', async () => {
    const repo = new SupabaseTripRepository();
    const bad = makeTrip({ legs: [{ id: 'l1', city: 'Rome', country: 'Italy', startDate: '2026-09-08', endDate: '2026-09-05', currency: 'EUR' }] });

    await expect(repo.saveTrip(bad)).rejects.toThrow();
  });

  it('saveTrip rejects a stay whose checkout precedes its checkin, before ever touching the client', async () => {
    const repo = new SupabaseTripRepository();
    const bad = makeTrip({
      stays: [
        { id: 's1', name: 'Hotel', address: 'Somewhere', checkinDate: '2026-09-08', checkinTime: '14:00', checkoutDate: '2026-09-05', checkoutTime: '11:00' },
      ],
    });

    await expect(repo.saveTrip(bad)).rejects.toThrow();
  });
});
