import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../../app/providers/AuthProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import type { Document } from '../../documents/types';
import type { Trip } from '../../trips/types';
import { FlightsTab } from './FlightsTab';
import type { Flight } from '../types';

function makeFlight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: 'f1',
    airline: 'Delta',
    flightNumber: 'DL123',
    depAirport: 'JFK',
    depDate: '2026-09-15',
    depTime: '10:00',
    arrAirport: 'LHR',
    arrDate: '2026-09-15',
    arrTime: '22:00',
    status: 'scheduled',
    ...overrides,
  };
}

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: 'Trip',
    homeCurrency: 'EUR',
    flights: [makeFlight()],
    stays: [],
    documents: [],
    ...overrides,
  } as Trip;
}

function renderTab(trip: Trip, updateTrip = vi.fn().mockResolvedValue(undefined)) {
  render(
    <ToastProvider>
      <AuthProvider>
        <FlightsTab trip={trip} updateTrip={updateTrip} />
      </AuthProvider>
    </ToastProvider>,
  );
  return { updateTrip };
}

const OPEN_FLIGHT = /Open Delta DL123/;

describe('FlightsTab — View Details', () => {
  it('tapping a flight card opens the read-only View, not the edit form', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip());
    await user.click(screen.getByRole('button', { name: OPEN_FLIGHT }));

    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('JFK')).toBeInTheDocument();
    expect(dialog.getByText('LHR')).toBeInTheDocument();
    expect(screen.queryByLabelText('Airline')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit flight')).not.toBeInTheDocument();
  });

  it('the View leads with the same journey layout the Flights list card uses for this flight — one visual system, not two', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip());
    const listDeparture = screen.getByRole('button', { name: OPEN_FLIGHT }).textContent;

    await user.click(screen.getByRole('button', { name: OPEN_FLIGHT }));
    const dialog = within(screen.getByRole('dialog'));

    // Same airports, times, and dates rendered by the shared FlightJourneyHeader in both places.
    expect(listDeparture).toContain('JFK');
    expect(dialog.getByText('10:00')).toBeInTheDocument();
    expect(dialog.getByText('22:00')).toBeInTheDocument();
  });

  it('Edit from the View transitions to FlightForm prefilled with the same flight', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip());
    await user.click(screen.getByRole('button', { name: OPEN_FLIGHT }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByText('Edit flight')).toBeInTheDocument();
    expect(screen.getByLabelText('Airline')).toHaveValue('Delta');
    // The View itself is gone, not stacked underneath the form.
    expect(screen.queryByText('Departure')).not.toBeInTheDocument();
  });

  it('closing the View returns to the same flights list', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip());
    await user.click(screen.getByRole('button', { name: OPEN_FLIGHT }));
    await user.click(screen.getByLabelText('Close'));

    expect(screen.queryByText('Departure')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: OPEN_FLIGHT })).toBeInTheDocument();
  });

  it('shows documents attached to this flight and excludes documents attached to something else', async () => {
    const user = userEvent.setup();
    const documents: Document[] = [
      { id: 'd1', category: 'boarding_pass', title: 'Delta boarding pass', relatedTo: 'JFK → LHR flight', fileType: 'pdf', storagePath: 'x', uploadedAt: '2026-01-01T00:00:00Z' },
      { id: 'd2', category: 'hotel_confirmation', title: 'Hotel confirmation', relatedTo: 'Some Hotel', fileType: 'pdf', storagePath: 'y', uploadedAt: '2026-01-01T00:00:00Z' },
    ];
    renderTab(makeTrip({ documents }));
    await user.click(screen.getByRole('button', { name: OPEN_FLIGHT }));

    expect(screen.getByText('Delta boarding pass')).toBeInTheDocument();
    expect(screen.queryByText('Hotel confirmation')).not.toBeInTheDocument();
  });

  it('shows a compact empty state, not a document list, when nothing is attached', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip());
    await user.click(screen.getByRole('button', { name: OPEN_FLIGHT }));
    expect(screen.getByText('No documents attached')).toBeInTheDocument();
  });

  it('omits rows for missing optional fields instead of showing them blank', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip()); // no terminal/gate/bookingRef/link on the base fixture
    await user.click(screen.getByRole('button', { name: OPEN_FLIGHT }));

    expect(screen.queryByText('Terminal')).not.toBeInTheDocument();
    expect(screen.queryByText('Gate')).not.toBeInTheDocument();
    expect(screen.queryByText('Booking reference')).not.toBeInTheDocument();
    expect(screen.queryByText('Link')).not.toBeInTheDocument();
  });

  it('shows optional fields when present', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip({ flights: [makeFlight({ terminal: 'T4', gate: 'B12', bookingRef: 'XZ99', link: 'https://example.com' })] }));
    await user.click(screen.getByRole('button', { name: OPEN_FLIGHT }));
    const dialog = within(screen.getByRole('dialog'));

    expect(dialog.getByText('Terminal')).toBeInTheDocument();
    expect(dialog.getByText('T4')).toBeInTheDocument();
    expect(dialog.getByText('Gate')).toBeInTheDocument();
    expect(dialog.getByText('XZ99')).toBeInTheDocument();
    expect(dialog.getByRole('link', { name: /Open/ })).toHaveAttribute('href', 'https://example.com');
  });

  it('existing behavior is unchanged: the Fab still opens "New flight" directly, no View step', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip());
    await user.click(screen.getByRole('button', { name: 'New flight' }));
    expect(screen.getByText('New flight')).toBeInTheDocument();
  });
});
