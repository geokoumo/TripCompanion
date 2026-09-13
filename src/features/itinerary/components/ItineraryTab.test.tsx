import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Trip } from '../../trips/types';
import { ItineraryTab } from './ItineraryTab';
import type { ItineraryStop } from '../types';

vi.mock('../../../app/providers/TripsProvider', () => ({
  useTripsContext: () => ({ getFullTrip: vi.fn() }),
}));
vi.mock('../../../app/providers/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const DATE = '2026-09-15';

function makeStop(overrides: Partial<ItineraryStop> = {}): ItineraryStop {
  return {
    id: 'stop1',
    date: DATE,
    time: '10:00',
    allDay: false,
    durationMinutes: 60,
    title: 'Sensō-ji Temple',
    type: 'sight',
    travelerIds: [],
    done: false,
    ...overrides,
  };
}

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: 'Trip',
    homeCurrency: 'EUR',
    legs: [{ id: 'l1', city: 'Tokyo', country: 'Japan', startDate: DATE, endDate: '2026-09-20', currency: 'EUR' }],
    flights: [],
    stays: [],
    itineraryStops: [makeStop()],
    ideas: [],
    travelers: [],
    rememberedLocations: [],
    ...overrides,
  } as Trip;
}

function renderTab(trip: Trip, updateTrip = vi.fn().mockResolvedValue(undefined)) {
  render(<ItineraryTab trip={trip} updateTrip={updateTrip} />);
  return { updateTrip };
}

const OPEN_STOP = /Open Sensō-ji Temple/;

describe('ItineraryTab — View Details', () => {
  it('tapping a stop card opens the read-only View, not the edit form', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip());
    await user.click(screen.getByRole('button', { name: OPEN_STOP }));

    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('Type')).toBeInTheDocument();
    expect(dialog.getByText('Sight')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('e.g. Sensō-ji Temple')).not.toBeInTheDocument();
    expect(screen.queryByText('New stop')).not.toBeInTheDocument();
  });

  it('never shows a Documents section for a stop — no existing relationship to reuse', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip());
    await user.click(screen.getByRole('button', { name: OPEN_STOP }));

    expect(screen.queryByText('Documents')).not.toBeInTheDocument();
  });

  it('Edit from the View transitions to StopForm prefilled with the same stop', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip());
    await user.click(screen.getByRole('button', { name: OPEN_STOP }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByText('Edit stop')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sensō-ji Temple')).toBeInTheDocument();
  });

  it('closing the View returns to the same itinerary day', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip());
    await user.click(screen.getByRole('button', { name: OPEN_STOP }));
    await user.click(screen.getByLabelText('Close'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: OPEN_STOP })).toBeInTheDocument();
  });

  it('shows travelers as "Everyone" when the stop names none, and by name when it does', async () => {
    const user = userEvent.setup();
    const trip = makeTrip({
      travelers: [{ id: 'trav1', name: 'Alex', avatarColor: 'avatar-1' }],
      itineraryStops: [makeStop({ travelerIds: ['trav1'] })],
    });
    renderTab(trip);
    await user.click(screen.getByRole('button', { name: OPEN_STOP }));
    expect(screen.getByText('Alex')).toBeInTheDocument();
  });

  it('omits rows for missing optional fields (location, note, link, duration) instead of showing them blank', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip({ itineraryStops: [makeStop({ location: undefined, note: undefined, link: undefined, durationMinutes: undefined })] }));
    await user.click(screen.getByRole('button', { name: OPEN_STOP }));

    expect(screen.queryByText('Location')).not.toBeInTheDocument();
    expect(screen.queryByText('Note')).not.toBeInTheDocument();
    expect(screen.queryByText('Link')).not.toBeInTheDocument();
    expect(screen.queryByText('Duration')).not.toBeInTheDocument();
  });

  it('shows an all-day stop\'s time as "All day" rather than a blank time', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip({ itineraryStops: [makeStop({ allDay: true, time: undefined, durationMinutes: undefined })] }));
    await user.click(screen.getByRole('button', { name: OPEN_STOP }));

    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('All day')).toBeInTheDocument();
  });

  it('existing behavior is unchanged: the Fab still opens "New stop" directly, no View step', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip());
    await user.click(screen.getByRole('button', { name: 'New stop' }));
    expect(screen.getByText('New stop')).toBeInTheDocument();
  });
});
