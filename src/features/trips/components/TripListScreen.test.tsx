import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../../app/providers/AuthProvider';
import { TripsProvider } from '../../../app/providers/TripsProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import type { Trip } from '../types';
import { TripListScreen } from './TripListScreen';

const TRIPS_KEY = 'tripcompanion:trips';

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    title: 'Rome Trip',
    homeCurrency: 'EUR',
    archived: false,
    travelers: [{ id: 'trav-1', name: 'Alex', avatarColor: 'avatar-1' }],
    legs: [{ id: 'leg-1', city: 'Rome', country: 'Italy', startDate: '2026-06-01', endDate: '2026-06-05', currency: 'EUR', exchangeRateToHome: null }],
    flights: [],
    stays: [],
    bookingItems: [],
    documents: [],
    itineraryStops: [],
    ideas: [],
    budgetCategories: [{ id: 'cat-1', name: 'Food', color: 'rust' }],
    rememberedLocations: [],
    expenses: [],
    checklistItems: [{ id: 'check-1', travelerId: 'trav-1', text: 'Passport', category: 'Docs', quantity: 1, done: false }],
    shareSettings: { enabled: true, includedTabs: ['overview'], shareToken: 'secret-abc' },
    schemaVersion: 2,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  } as Trip;
}

function renderScreen(onOpenTrip = vi.fn()) {
  render(
    <ToastProvider>
      <AuthProvider>
        <TripsProvider>
          <TripListScreen onOpenTrip={onOpenTrip} />
        </TripsProvider>
      </AuthProvider>
    </ToastProvider>,
  );
  return { onOpenTrip };
}

function readStoredTrips(): Trip[] {
  return JSON.parse(localStorage.getItem(TRIPS_KEY) ?? '[]');
}

// This exercises the real local/guest persistence path (LocalStorageTripRepository,
// unmocked) end to end — no VITE_SUPABASE_* env vars are set in the test
// environment, so TripsProvider resolves to guest mode the same way it does
// in the actual app when signed out. There is no equivalent harness in this
// test suite for exercising SupabaseTripRepository against a real backend,
// so the authenticated-mode path is only covered structurally: it shares
// this exact same saveTrip() call and cloneTripForDuplication() output, and
// ownership/RLS are handled entirely server-side inside upsert_full_trip,
// untouched by this change.
describe('TripListScreen — Duplicate trip (guest/local persistence)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates a new, independently-persisted trip and opens it', async () => {
    const original = makeTrip();
    localStorage.setItem(TRIPS_KEY, JSON.stringify([original]));
    const { onOpenTrip } = renderScreen();

    await screen.findByText('Rome Trip');
    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: 'More' })[0]!);
    await screen.findByText('Duplicate trip');
    await user.click(screen.getByText('Duplicate trip'));

    await waitFor(() => expect(onOpenTrip).toHaveBeenCalled());
    const newTripId = onOpenTrip.mock.calls[0]![0] as string;
    expect(newTripId).not.toBe(original.id);

    const stored = readStoredTrips();
    expect(stored).toHaveLength(2);

    const persistedOriginal = stored.find((t) => t.id === original.id)!;
    const persistedClone = stored.find((t) => t.id === newTripId)!;
    expect(persistedOriginal).toEqual(original);
    expect(persistedClone.title).toBe('Rome Trip Copy');
    expect(persistedClone.legs[0]!.id).not.toBe(original.legs[0]!.id);
    expect(persistedClone.travelers[0]!.id).not.toBe(original.travelers[0]!.id);
    expect(persistedClone.checklistItems[0]!.travelerId).toBe(persistedClone.travelers[0]!.id);
    expect(persistedClone.shareSettings).toEqual({ enabled: false, includedTabs: [] });
  });

  it('leaves the original trip open-able and unaffected after duplicating', async () => {
    const original = makeTrip();
    localStorage.setItem(TRIPS_KEY, JSON.stringify([original]));
    renderScreen();

    await screen.findByText('Rome Trip');
    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: 'More' })[0]!);
    await screen.findByText('Duplicate trip');
    await user.click(screen.getByText('Duplicate trip'));

    // Both the original and the new "… Copy" card are now visible.
    await screen.findByText('Rome Trip Copy');
    expect(screen.getByText('Rome Trip')).toBeInTheDocument();
  });
});
