import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Trip } from '../../trips/types';
import type { Traveler } from '../../travelers/types';
import { ExpenseForm } from './ExpenseForm';

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 't1',
    title: 'Trip',
    homeCurrency: 'EUR',
    legs: [{ id: 'l1', city: 'Rome', country: 'Italy', startDate: '2026-09-05', endDate: '2026-09-12', currency: 'EUR', exchangeRateToHome: null }],
    flights: [],
    travelers: [],
    budgetCategories: [{ id: 'c1', name: 'Food', color: 'rust' }],
    ...overrides,
  } as Trip;
}

function renderForm(travelers: Traveler[]) {
  const onSave = vi.fn();
  const trip = makeTrip({ travelers });
  render(
    <ExpenseForm
      trip={trip}
      categories={trip.budgetCategories}
      travelers={travelers}
      updateTrip={vi.fn().mockResolvedValue(undefined)}
      onClose={vi.fn()}
      onSave={onSave}
    />,
  );
  return { onSave };
}

describe('ExpenseForm — zero travelers on the trip', () => {
  it("explains why Save is disabled instead of leaving it silently stuck (no traveler to set as 'paid by')", () => {
    renderForm([]);

    expect(screen.getByText('Add a traveler to this trip before logging an expense.')).toBeInTheDocument();
    expect(screen.queryByText('Paid by')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('shows the normal "Paid by" picker and no warning once the trip has a traveler', () => {
    renderForm([{ id: 'trav-1', name: 'Alex', avatarColor: 'avatar-1' }]);

    expect(screen.getByText('Paid by')).toBeInTheDocument();
    expect(screen.queryByText('Add a traveler to this trip before logging an expense.')).not.toBeInTheDocument();
  });
});
