import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../../app/providers/AuthProvider';
import type { Flight } from '../../flights/types';
import type { Stay } from '../../stays/types';
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

function makeFlight(overrides: Partial<Flight> = {}): Flight {
  return {
    id: 'flight1',
    airline: 'ANA',
    flightNumber: 'NH1',
    depAirport: 'HND',
    depDate: DATE,
    depTime: '08:00',
    arrAirport: 'ITM',
    arrDate: DATE,
    arrTime: '09:15',
    status: 'scheduled',
    ...overrides,
  };
}

function makeStay(overrides: Partial<Stay> = {}): Stay {
  return {
    id: 'stay1',
    name: 'Mimaru Kyoto',
    address: 'Kyoto',
    checkinDate: DATE,
    checkinTime: '15:00',
    checkoutDate: '2026-09-18',
    checkoutTime: '11:00',
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
    documents: [],
    ...overrides,
  } as Trip;
}

// Mirrors how TripDetailScreen owns selectedDate so ItineraryTab's real
// (now-controlled) behavior is exercised the same way it runs in the app.
function ItineraryTabHarness({ trip, updateTrip }: { trip: Trip; updateTrip: (updater: (t: Trip) => Trip) => Promise<void> }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  return <ItineraryTab trip={trip} updateTrip={updateTrip} selectedDate={selectedDate} onSelectedDateChange={setSelectedDate} />;
}

function renderTab(trip: Trip, updateTrip = vi.fn().mockResolvedValue(undefined)) {
  render(
    <AuthProvider>
      <ItineraryTabHarness trip={trip} updateTrip={updateTrip} />
    </AuthProvider>,
  );
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

describe('ItineraryTab — a stop\'s location never contaminates stay-address suggestions', () => {
  it('saving a new stop with a location leaves trip.rememberedLocations untouched', async () => {
    const user = userEvent.setup();
    const { updateTrip } = renderTab(makeTrip({ itineraryStops: [] }));
    await user.click(screen.getByRole('button', { name: 'New stop' }));
    await user.type(screen.getByLabelText('What'), 'Coffee break');
    await user.type(screen.getByLabelText('Location'), 'rue');
    await user.click(screen.getByRole('button', { name: 'All day' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(updateTrip).toHaveBeenCalled();
    const updater = updateTrip.mock.calls[0]![0] as (t: Trip) => Trip;
    const result = updater(makeTrip({ itineraryStops: [] }));
    expect(result.itineraryStops.some((s) => s.location === 'rue')).toBe(true);
    expect(result.rememberedLocations).toEqual([]);
  });
});

describe('ItineraryTab — trip-relative day framing', () => {
  it('shows each day\'s trip-relative position, computed from the actual trip range, not hardcoded', () => {
    // Trip spans 15-20 Sep (6 days); the 3rd day chip (17 Sep) should read D3.
    renderTab(makeTrip());
    const thirdDayTab = screen.getAllByRole('tab')[2]!;
    expect(within(thirdDayTab).getByText('D3')).toBeInTheDocument();
  });

  it('combines day-of-trip, leg city, and arrival context into the leg header on the leg\'s first day', () => {
    renderTab(makeTrip());
    // DATE (15 Sep) is both day 1 of the trip and the leg's startDate.
    expect(screen.getByText('DAY 1 OF 6 · TOKYO · ARRIVAL')).toBeInTheDocument();
  });

  it('shows departure context on a leg\'s last day', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip());
    await user.click(screen.getByRole('tab', { name: /20/ }));
    expect(screen.getByText('DAY 6 OF 6 · TOKYO · DEPARTURE')).toBeInTheDocument();
  });

  it('shows no arrival/departure suffix for a day in the middle of a leg', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip());
    await user.click(screen.getByRole('tab', { name: /17/ }));
    expect(screen.getByText('DAY 3 OF 6 · TOKYO')).toBeInTheDocument();
    expect(screen.queryByText(/ARRIVAL/)).not.toBeInTheDocument();
    expect(screen.queryByText(/DEPARTURE/)).not.toBeInTheDocument();
  });

  it('omits the city segment entirely (never a "NO CITY"/"Unknown" placeholder) when a leg has no city yet', () => {
    renderTab(makeTrip({ legs: [{ id: 'l1', city: '', country: '', startDate: DATE, endDate: '2026-09-20', currency: 'EUR' }] }));
    expect(screen.getByText('DAY 1 OF 6 · ARRIVAL')).toBeInTheDocument();
    expect(screen.queryByText(/NO CITY/)).not.toBeInTheDocument();
    expect(screen.queryByText(/UNKNOWN/i)).not.toBeInTheDocument();
  });
});

describe('ItineraryTab — selected day survives navigating away and back', () => {
  // ItineraryTab unmounts whenever the user switches to another in-trip tab
  // (TripDetailScreen only renders it while Itinerary is active). The parent
  // owns selectedDate precisely so a round trip to another tab doesn't reset
  // the picked day back to today/day one.
  it('reports the picked day up via onSelectedDateChange instead of only tracking it internally', async () => {
    const user = userEvent.setup();
    const onSelectedDateChange = vi.fn();
    render(
      <AuthProvider>
        <ItineraryTab trip={makeTrip()} updateTrip={vi.fn().mockResolvedValue(undefined)} selectedDate={null} onSelectedDateChange={onSelectedDateChange} />
      </AuthProvider>,
    );
    await user.click(screen.getByRole('tab', { name: /17/ }));
    expect(onSelectedDateChange).toHaveBeenCalledWith('2026-09-17');
  });

  it('restores a previously-selected day passed back in via the selectedDate prop', () => {
    render(
      <AuthProvider>
        <ItineraryTab trip={makeTrip()} updateTrip={vi.fn().mockResolvedValue(undefined)} selectedDate="2026-09-17" onSelectedDateChange={vi.fn()} />
      </AuthProvider>,
    );
    expect(screen.getByText('DAY 3 OF 6 · TOKYO')).toBeInTheDocument();
  });

  it('falls back to the default day when the given selectedDate no longer falls within this trip', () => {
    render(
      <AuthProvider>
        <ItineraryTab trip={makeTrip()} updateTrip={vi.fn().mockResolvedValue(undefined)} selectedDate="2099-01-01" onSelectedDateChange={vi.fn()} />
      </AuthProvider>,
    );
    expect(screen.getByText('DAY 1 OF 6 · TOKYO · ARRIVAL')).toBeInTheDocument();
  });
});

describe('ItineraryTab — auto-pulled entries stay read-only projections', () => {
  it('restyles an auto-pulled entry with a FROM YOUR BOOKING label and its confirmation number, when the source has one', () => {
    // A single flight contributes both a departure and an arrival checkpoint.
    renderTab(makeTrip({ flights: [makeFlight({ bookingRef: 'AB-9' })] }));
    expect(screen.getAllByText('FROM YOUR BOOKING')).toHaveLength(2);
    expect(screen.getAllByText('Confirmation #AB-9')).toHaveLength(2);
  });

  it('never invents a confirmation number for a source with none', () => {
    renderTab(makeTrip({ flights: [makeFlight()] }));
    expect(screen.queryByText(/Confirmation #/)).not.toBeInTheDocument();
  });

  it('tapping an auto-pulled flight entry opens the read-only Flight View, not an editable form', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip({ flights: [makeFlight()] }));
    await user.click(screen.getByRole('button', { name: /Departure — ANA NH1 — HND/ }));

    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('HND')).toBeInTheDocument();
    expect(screen.queryByLabelText('Airline')).not.toBeInTheDocument();
  });

  it('Edit from an auto-pulled flight\'s View opens the exact same Flight record in the real FlightForm', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip({ flights: [makeFlight()] }));
    await user.click(screen.getByRole('button', { name: /Departure — ANA NH1 — HND/ }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByText('Edit flight')).toBeInTheDocument();
    expect(screen.getByLabelText('Airline')).toHaveValue('ANA');
  });

  it('tapping an auto-pulled stay entry opens the read-only Stay View, and Edit reaches the real StayForm', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip({ stays: [makeStay()] }));
    await user.click(screen.getByRole('button', { name: /Check-in — Mimaru Kyoto/ }));
    expect(within(screen.getByRole('dialog')).getByText('Check-in')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByText('Edit stay')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Mimaru Kyoto');
  });

  it('never renders a delete action for a flight/stay reached from the itinerary — deleting it is Flights/Stays\' own concern', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip({ flights: [makeFlight()] }));
    await user.click(screen.getByRole('button', { name: /Departure — ANA NH1 — HND/ }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });
});
