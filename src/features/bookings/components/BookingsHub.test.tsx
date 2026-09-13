import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../../app/providers/AuthProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import type { Trip } from '../../trips/types';
import type { Flight } from '../../flights/types';
import type { Stay } from '../../stays/types';
import type { BookingItem } from '../types';
import { BookingsHub } from './BookingsHub';

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

function makeStay(overrides: Partial<Stay> = {}): Stay {
  return {
    id: 's1',
    name: 'Park Hyatt Tokyo',
    address: '3-7-1-2 Nishi-Shinjuku',
    checkinDate: '2026-09-16',
    checkinTime: '15:00',
    checkoutDate: '2026-09-18',
    checkoutTime: '11:00',
    ...overrides,
  };
}

function makeBookingItem(overrides: Partial<BookingItem> = {}): BookingItem {
  return {
    id: 'b1',
    type: 'restaurant',
    name: 'Sushi Dai',
    date: '2026-09-17',
    startTime: '19:00',
    details: {},
    ...overrides,
  } as BookingItem;
}

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: 'Trip',
    homeCurrency: 'EUR',
    flights: [makeFlight()],
    stays: [makeStay()],
    bookingItems: [makeBookingItem()],
    documents: [],
    rememberedLocations: [],
    itineraryStops: [],
    ...overrides,
  } as Trip;
}

function renderHub(trip: Trip, updateTrip = vi.fn().mockResolvedValue(undefined)) {
  render(
    <ToastProvider>
      <AuthProvider>
        <BookingsHub trip={trip} updateTrip={updateTrip} />
      </AuthProvider>
    </ToastProvider>,
  );
  return { updateTrip };
}

describe('BookingsHub — unified feed', () => {
  it('shows a flight, a stay, and a booking item in one chronological feed', () => {
    renderHub(makeTrip());

    expect(screen.getByRole('button', { name: /Open Delta DL123/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Park Hyatt Tokyo/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Sushi Dai/ })).toBeInTheDocument();
  });

  it('orders rows chronologically across entity kinds', () => {
    renderHub(makeTrip());
    const rows = screen.getAllByRole('button', { name: /^Open / });
    const titles = rows.map((r) => r.getAttribute('aria-label'));
    // flight (9/15) -> stay check-in (9/16) -> booking (9/17)
    expect(titles).toEqual(['Open Delta DL123, Scheduled', 'Open Park Hyatt Tokyo, Check-in 15:00', 'Open Sushi Dai']);
  });

  it('shows a real, non-invented status pill for a flight and plain check-in text for a stay', () => {
    renderHub(makeTrip());
    const flightRow = screen.getByRole('button', { name: /Open Delta DL123/ });
    const stayRow = screen.getByRole('button', { name: /Open Park Hyatt Tokyo/ });
    expect(within(flightRow).getByText('Scheduled')).toBeInTheDocument();
    expect(within(stayRow).getByText('Check-in 15:00')).toBeInTheDocument();
  });

  it('opening a flight row shows the real FlightDetailView, not a duplicate record', async () => {
    const user = userEvent.setup();
    renderHub(makeTrip());
    await user.click(screen.getByRole('button', { name: /Open Delta DL123/ }));

    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('JFK')).toBeInTheDocument();
    expect(dialog.getByText('LHR')).toBeInTheDocument();
  });

  it('opening a stay row shows the real StayDetailView', async () => {
    const user = userEvent.setup();
    renderHub(makeTrip());
    await user.click(screen.getByRole('button', { name: /Open Park Hyatt Tokyo/ }));

    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('3-7-1-2 Nishi-Shinjuku')).toBeInTheDocument();
  });

  it('editing a flight from the Hub saves in place without creating a duplicate flight', async () => {
    const user = userEvent.setup();
    const { updateTrip } = renderHub(makeTrip());
    await user.click(screen.getByRole('button', { name: /Open Delta DL123/ }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(updateTrip).toHaveBeenCalled();
    const updater = updateTrip.mock.calls[0]![0] as (t: Trip) => Trip;
    const result = updater(makeTrip());
    expect(result.flights).toHaveLength(1);
    expect(result.flights[0]!.id).toBe('f1');
  });

  it('never invents a status label for a booking item', () => {
    renderHub(makeTrip());
    const row = screen.getByRole('button', { name: /Open Sushi Dai/ });
    expect(within(row).queryByText(/ticket ready|booked|planned/i)).not.toBeInTheDocument();
  });

  it('shows the empty state when the trip has no flights, stays, or booking items', () => {
    renderHub(makeTrip({ flights: [], stays: [], bookingItems: [] }));
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('shows a "Doc attached" indicator only for rows with a related document', () => {
    renderHub(
      makeTrip({
        documents: [
          {
            id: 'd1',
            category: 'boarding_pass',
            title: 'Boarding pass',
            relatedTo: 'JFK → LHR flight',
            fileType: 'pdf',
            storagePath: 'x',
            uploadedAt: '2026-01-01T00:00:00Z',
          },
        ],
      }),
    );
    const flightRow = screen.getByRole('button', { name: /Open Delta DL123/ });
    const stayRow = screen.getByRole('button', { name: /Open Park Hyatt Tokyo/ });
    expect(within(flightRow).getByText('Doc attached')).toBeInTheDocument();
    expect(within(stayRow).queryByText('Doc attached')).not.toBeInTheDocument();
  });

  it('announces status and "document attached" in the accessible name, not just visually', () => {
    renderHub(
      makeTrip({
        documents: [
          {
            id: 'd1',
            category: 'boarding_pass',
            title: 'Boarding pass',
            relatedTo: 'JFK → LHR flight',
            fileType: 'pdf',
            storagePath: 'x',
            uploadedAt: '2026-01-01T00:00:00Z',
          },
        ],
      }),
    );
    const flightRow = screen.getByRole('button', { name: /Open Delta DL123/ });
    expect(flightRow).toHaveAccessibleName('Open Delta DL123, Scheduled, document attached');
  });
});
