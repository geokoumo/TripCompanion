import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { User } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import type { Trip } from '../types';
import { ShareSheet } from './ShareSheet';

// ShareSheet now re-reads the trip via getFullTrip before saving a share
// link (see saveTripPatch) — same mocking pattern used elsewhere for this context.
const { getFullTripMock } = vi.hoisted(() => ({ getFullTripMock: vi.fn() }));
vi.mock('../../../app/providers/TripsProvider', () => ({
  useTripsContext: () => ({ getFullTrip: getFullTripMock }),
}));

// F-10: sharing requires an account (a guest trip has no Supabase row for
// get_shared_trip to ever resolve) — signed-in by default so the existing
// share-flow tests below are unaffected; the guest-mode test overrides this.
const mockAuth = vi.hoisted(() => ({ user: { id: 'u1', email: 'alex@example.com' } as User | null }));
vi.mock('../../../app/providers/AuthProvider', () => ({
  useAuth: () => mockAuth,
}));

beforeEach(() => {
  getFullTripMock.mockReset();
  getFullTripMock.mockResolvedValue(undefined); // falls back to the trip prop, same as the app's own fallback
  mockAuth.user = { id: 'u1', email: 'alex@example.com' } as User;
});

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: 'Trip',
    homeCurrency: 'EUR',
    shareSettings: { enabled: false, includedTabs: [] },
    ...overrides,
  } as Trip;
}

function renderSheet(trip: Trip, onSave = vi.fn().mockResolvedValue(undefined)) {
  render(
    <ToastProvider>
      <ShareSheet trip={trip} onClose={vi.fn()} onSave={onSave} />
    </ToastProvider>,
  );
  return { onSave };
}

describe('ShareSheet — tab chip accessible state', () => {
  it('exposes each tab chip\'s selected state via aria-pressed, not just a visual attribute', () => {
    renderSheet(makeTrip());
    const overviewChip = screen.getByRole('button', { name: 'Overview' });
    const flightsChip = screen.getByRole('button', { name: 'Flights' });
    // Overview is included by default when no share settings exist yet.
    expect(overviewChip).toHaveAttribute('aria-pressed', 'true');
    expect(flightsChip).toHaveAttribute('aria-pressed', 'false');
  });

  it('flips aria-pressed when a chip is toggled', async () => {
    const user = userEvent.setup();
    renderSheet(makeTrip());
    const flightsChip = screen.getByRole('button', { name: 'Flights' });
    expect(flightsChip).toHaveAttribute('aria-pressed', 'false');
    await user.click(flightsChip);
    expect(flightsChip).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('ShareSheet — guest/local mode (F-10)', () => {
  it('explains that sharing requires an account instead of offering to create a link', () => {
    mockAuth.user = null;
    renderSheet(makeTrip());
    expect(screen.getByText(/sign in to share this trip/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create link' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Overview' })).not.toBeInTheDocument();
  });

  it('shows the normal share flow for a signed-in user', () => {
    mockAuth.user = { id: 'u1', email: 'alex@example.com' } as User;
    renderSheet(makeTrip());
    expect(screen.getByRole('button', { name: 'Create link' })).toBeInTheDocument();
    expect(screen.queryByText(/sign in to share this trip/i)).not.toBeInTheDocument();
  });
});
