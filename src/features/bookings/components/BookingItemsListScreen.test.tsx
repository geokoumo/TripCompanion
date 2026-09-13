import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../../app/providers/AuthProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import type { Document } from '../../documents/types';
import type { Trip } from '../../trips/types';
import { BookingItemsListScreen } from './BookingItemsListScreen';
import type { BookingItem } from '../types';

function makeItem(overrides: Partial<BookingItem> = {}): BookingItem {
  return {
    id: 'b1',
    type: 'restaurant',
    name: 'Sushi Dai',
    details: {},
    ...overrides,
  };
}

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: 'Trip',
    homeCurrency: 'EUR',
    bookingItems: [makeItem()],
    legs: [],
    flights: [],
    documents: [],
    ...overrides,
  } as Trip;
}

function renderScreen(trip: Trip, updateTrip = vi.fn().mockResolvedValue(undefined)) {
  render(
    <ToastProvider>
      <AuthProvider>
        <BookingItemsListScreen type="restaurant" trip={trip} updateTrip={updateTrip} />
      </AuthProvider>
    </ToastProvider>,
  );
  return { updateTrip };
}

const OPEN_ITEM = /Open Sushi Dai/;

describe('BookingItemsListScreen — View Details', () => {
  it('tapping a booking item card opens the read-only View, not the edit form', async () => {
    const user = userEvent.setup();
    renderScreen(makeTrip());
    await user.click(screen.getByRole('button', { name: OPEN_ITEM }));

    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('Type')).toBeInTheDocument();
    expect(dialog.getByText('Restaurant')).toBeInTheDocument();
    expect(screen.queryByLabelText('Restaurant name')).not.toBeInTheDocument();
  });

  it('Edit from the View transitions to BookingItemForm prefilled with the same item', async () => {
    const user = userEvent.setup();
    renderScreen(makeTrip());
    await user.click(screen.getByRole('button', { name: OPEN_ITEM }));
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByText('Edit restaurant')).toBeInTheDocument();
    expect(screen.getByLabelText('Restaurant name')).toHaveValue('Sushi Dai');
  });

  it('closing the View returns to the same list', async () => {
    const user = userEvent.setup();
    renderScreen(makeTrip());
    await user.click(screen.getByRole('button', { name: OPEN_ITEM }));
    await user.click(screen.getByLabelText('Close'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: OPEN_ITEM })).toBeInTheDocument();
  });

  it('shows documents attached to this item (matching its saved relatedTo, fallback included) and excludes unrelated ones', async () => {
    const user = userEvent.setup();
    const documents: Document[] = [
      { id: 'd1', category: 'other', title: 'Reservation confirmation', relatedTo: 'Sushi Dai', fileType: 'pdf', storagePath: 'x', uploadedAt: '2026-01-01T00:00:00Z' },
      { id: 'd2', category: 'boarding_pass', title: 'Boarding pass', relatedTo: 'JFK → NRT flight', fileType: 'pdf', storagePath: 'y', uploadedAt: '2026-01-01T00:00:00Z' },
    ];
    renderScreen(makeTrip({ documents }));
    await user.click(screen.getByRole('button', { name: OPEN_ITEM }));

    expect(screen.getByText('Reservation confirmation')).toBeInTheDocument();
    expect(screen.queryByText('Boarding pass')).not.toBeInTheDocument();
  });

  it('an item with a blank name still matches documents uploaded via the form\'s own fallback label ("Restaurant")', async () => {
    // Regression: the list's own "Ticket attached" badge previously matched
    // only on the raw (possibly blank) name, while the form fell back to the
    // type's singular label — the two could disagree. Both now go through
    // the same bookingItemRelatedTo() helper.
    const user = userEvent.setup();
    const documents: Document[] = [
      { id: 'd1', category: 'other', title: 'Voucher', relatedTo: 'Restaurant', fileType: 'pdf', storagePath: 'x', uploadedAt: '2026-01-01T00:00:00Z' },
    ];
    renderScreen(makeTrip({ bookingItems: [makeItem({ name: '' })], documents }));
    expect(screen.getByText('Ticket attached')).toBeInTheDocument();

    // BookingItemCard's own aria-label uses the raw (blank) name, unrelated
    // to this fix — select the card by its visible content instead.
    await user.click(screen.getByText('Ticket attached').closest('button')!);
    expect(screen.getByText('Voucher')).toBeInTheDocument();
  });

  it('omits rows for missing optional fields instead of showing them blank', async () => {
    const user = userEvent.setup();
    renderScreen(makeTrip());
    await user.click(screen.getByRole('button', { name: OPEN_ITEM }));

    expect(screen.queryByText('Booking reference')).not.toBeInTheDocument();
    expect(screen.queryByText('Notes')).not.toBeInTheDocument();
    expect(screen.queryByText('Party size')).not.toBeInTheDocument();
  });

  it('shows type-specific details (cuisine, price range, party size) when present', async () => {
    const user = userEvent.setup();
    renderScreen(
      makeTrip({
        bookingItems: [makeItem({ details: { cuisineType: 'Sushi', priceRange: '$$$' }, partySize: 2, bookingReference: 'RES-9' })],
      }),
    );
    await user.click(screen.getByRole('button', { name: OPEN_ITEM }));
    const dialog = within(screen.getByRole('dialog'));

    expect(dialog.getByText('Sushi')).toBeInTheDocument();
    expect(dialog.getByText('$$$')).toBeInTheDocument();
    expect(dialog.getByText('RES-9')).toBeInTheDocument();
    expect(dialog.getByText('2')).toBeInTheDocument();
  });

  it('existing behavior is unchanged: the Fab still opens the New form directly, no View step', async () => {
    const user = userEvent.setup();
    renderScreen(makeTrip());
    await user.click(screen.getByRole('button', { name: 'New restaurant' }));
    expect(screen.getByText('New restaurant')).toBeInTheDocument();
  });
});
