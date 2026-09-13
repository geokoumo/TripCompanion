import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../../app/providers/AuthProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import type { Flight } from '../../flights/types';
import type { Stay } from '../../stays/types';
import type { BookingItem } from '../../bookings/types';
import type { Trip } from '../types';
import { OverviewTab } from './OverviewTab';

const TODAY = '2026-09-13';

function trip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'trip1',
    title: 'Test Trip',
    homeCurrency: 'EUR',
    archived: false,
    description: null,
    travelers: [{ id: 't1', name: 'Nikos', avatarColor: 'avatar-1' }],
    legs: [{ id: 'l1', city: 'Tokyo', country: 'Japan', startDate: '2026-09-10', endDate: '2026-09-19', currency: 'JPY' }],
    flights: [],
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
    createdAt: TODAY,
    ...overrides,
  } as Trip;
}

function makeFlight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: 'f1',
    airline: 'Emirates',
    flightNumber: 'EK210',
    depAirport: 'DXB',
    depDate: '2026-09-10',
    depTime: '03:00',
    arrAirport: 'HND',
    arrDate: '2026-09-10',
    arrTime: '18:00',
    status: 'scheduled',
    ...overrides,
  };
}

function makeStay(overrides: Partial<Stay> = {}): Stay {
  return {
    id: 's1',
    name: 'Park Hyatt Tokyo',
    address: '1-1-1 Higashi-Shinjuku',
    checkinDate: '2026-09-10',
    checkinTime: '15:00',
    checkoutDate: '2026-09-19',
    checkoutTime: '11:00',
    ...overrides,
  };
}

function makeBookingItem(overrides: Partial<BookingItem> = {}): BookingItem {
  return {
    id: 'b1',
    type: 'transport',
    name: 'Shinkansen to Kyoto',
    date: '2026-09-16',
    details: {},
    ...overrides,
  } as BookingItem;
}

function renderOverview(t: Trip) {
  render(
    <ToastProvider>
      <AuthProvider>
        <OverviewTab trip={t} updateTrip={vi.fn().mockResolvedValue(undefined)} onOpenTripHealth={vi.fn()} />
      </AuthProvider>
    </ToastProvider>,
  );
}

describe('OverviewTab — trip progress badge', () => {
  it('shows a dynamically computed "Day N of M" badge for a trip in progress', () => {
    vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
    renderOverview(trip());
    // 10 Sep to 19 Sep inclusive is 10 days; 13 Sep is day 4.
    expect(screen.getByText('DAY 4 OF 10')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('shows an "In N days" badge for a trip that has not started yet, not a fabricated day count', () => {
    vi.setSystemTime(new Date('2026-09-08T12:00:00Z'));
    renderOverview(trip());
    expect(screen.getByText('IN 2 DAYS')).toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe('OverviewTab — Booking Summary', () => {
  it('lists active flights, stays, and booking items, and excludes ones that have already concluded', () => {
    vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
    renderOverview(
      trip({
        flights: [makeFlight({ id: 'f1', depDate: '2026-09-15', arrDate: '2026-09-15' }), makeFlight({ id: 'f2', depDate: '2026-09-01', arrDate: '2026-09-01' })],
        stays: [makeStay()],
        bookingItems: [makeBookingItem()],
      }),
    );

    expect(screen.getByText('Booking Summary')).toBeInTheDocument();
    expect(screen.getByText('Emirates EK210')).toBeInTheDocument();
    expect(screen.getByText('Park Hyatt Tokyo')).toBeInTheDocument();
    expect(screen.getByText('Shinkansen to Kyoto')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('omits the Booking Summary section entirely when nothing is active', () => {
    vi.setSystemTime(new Date(`${TODAY}T12:00:00Z`));
    renderOverview(trip());
    expect(screen.queryByText('Booking Summary')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
