import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../../app/providers/AuthProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import type { Document } from '../../documents/types';
import type { Trip } from '../../trips/types';
import { StaysTab } from './StaysTab';
import type { Stay } from '../types';

function makeStay(overrides: Partial<Stay> = {}): Stay {
  return {
    id: 's1',
    name: 'Park Hyatt Tokyo',
    address: '3-7-1-2 Nishi-Shinjuku',
    checkinDate: '2026-09-15',
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
    stays: [makeStay()],
    flights: [],
    documents: [],
    rememberedLocations: [],
    ...overrides,
  } as Trip;
}

function renderTab(trip: Trip, updateTrip = vi.fn().mockResolvedValue(undefined)) {
  render(
    <ToastProvider>
      <AuthProvider>
        <StaysTab trip={trip} updateTrip={updateTrip} />
      </AuthProvider>
    </ToastProvider>,
  );
  return { updateTrip };
}

const OPEN_STAY = /Open Park Hyatt Tokyo/;

describe('StaysTab — View Details', () => {
  it('tapping a stay card opens the read-only View, not the edit form', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip());
    await user.click(screen.getByRole('button', { name: OPEN_STAY }));
    const dialog = within(screen.getByRole('dialog'));

    expect(dialog.getByText('Check-in')).toBeInTheDocument();
    expect(dialog.getByText('Check-out')).toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit stay')).not.toBeInTheDocument();
  });

  it('Edit from the View transitions to StayForm prefilled with the same stay', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip());
    await user.click(screen.getByRole('button', { name: OPEN_STAY }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByText('Edit stay')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Park Hyatt Tokyo');
    // The View sheet itself is gone, not stacked underneath the form.
    expect(screen.queryByRole('dialog', { name: /^Park Hyatt Tokyo$/ })).not.toBeInTheDocument();
  });

  it('closing the View returns to the same stays list', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip());
    await user.click(screen.getByRole('button', { name: OPEN_STAY }));
    await user.click(screen.getByLabelText('Close'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: OPEN_STAY })).toBeInTheDocument();
  });

  it('shows documents attached to this stay and excludes documents attached to something else', async () => {
    const user = userEvent.setup();
    const documents: Document[] = [
      { id: 'd1', category: 'hotel_confirmation', title: 'Hyatt confirmation', relatedTo: 'Park Hyatt Tokyo', fileType: 'pdf', storagePath: 'x', uploadedAt: '2026-01-01T00:00:00Z' },
      { id: 'd2', category: 'boarding_pass', title: 'Boarding pass', relatedTo: 'JFK → NRT flight', fileType: 'pdf', storagePath: 'y', uploadedAt: '2026-01-01T00:00:00Z' },
    ];
    renderTab(makeTrip({ documents }));
    await user.click(screen.getByRole('button', { name: OPEN_STAY }));

    expect(screen.getByText('Hyatt confirmation')).toBeInTheDocument();
    expect(screen.queryByText('Boarding pass')).not.toBeInTheDocument();
  });

  it('omits rows for missing optional fields instead of showing them blank', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip());
    await user.click(screen.getByRole('button', { name: OPEN_STAY }));

    expect(screen.queryByText('Phone')).not.toBeInTheDocument();
    expect(screen.queryByText('Booking reference')).not.toBeInTheDocument();
    expect(screen.queryByText('Notes')).not.toBeInTheDocument();
  });

  it('shows optional fields when present', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip({ stays: [makeStay({ phone: '+81-3-1234', bookingRef: 'HB-1', notes: 'Late checkout arranged' })] }));
    await user.click(screen.getByRole('button', { name: OPEN_STAY }));
    const dialog = within(screen.getByRole('dialog'));

    expect(dialog.getByText('+81-3-1234')).toBeInTheDocument();
    expect(dialog.getByText('HB-1')).toBeInTheDocument();
    expect(dialog.getByText('Late checkout arranged')).toBeInTheDocument();
  });

  it('existing behavior is unchanged: the Fab still opens "New stay" directly, no View step', async () => {
    const user = userEvent.setup();
    renderTab(makeTrip());
    await user.click(screen.getByRole('button', { name: 'New stay' }));
    expect(screen.getByText('New stay')).toBeInTheDocument();
  });
});
