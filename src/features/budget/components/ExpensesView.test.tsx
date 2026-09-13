import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import type { Trip } from '../../trips/types';
import type { BudgetCategory, Expense } from '../types';
import { ExpensesView } from './ExpensesView';

function makeCategory(overrides: Partial<BudgetCategory> = {}): BudgetCategory {
  return { id: 'c1', name: 'Food', color: 'rust', ...overrides };
}

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'e1',
    amount: 50,
    currency: 'EUR',
    categoryId: 'c1',
    date: '2026-09-12',
    paidBy: 't1',
    splitAmong: ['t1'],
    ...overrides,
  };
}

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'trip1',
    title: 'Trip',
    homeCurrency: 'EUR',
    travelers: [{ id: 't1', name: 'Alex', avatarColor: 'avatar-1' }],
    budgetCategories: [makeCategory()],
    expenses: [makeExpense()],
    legs: [],
    flights: [],
    ...overrides,
  } as Trip;
}

function renderView(trip: Trip, updateTrip = vi.fn().mockResolvedValue(undefined)) {
  render(
    <ToastProvider>
      <ExpensesView trip={trip} updateTrip={updateTrip} />
    </ToastProvider>,
  );
  return { updateTrip };
}

describe('ExpensesView — expense date must stay within the trip (domain-level, not just the picker)', () => {
  const tripWithLegs = () =>
    makeTrip({
      expenses: [makeExpense({ date: '2026-09-01' })], // outside the leg below — legacy/edit scenario
      legs: [{ id: 'l1', city: 'Tokyo', country: 'Japan', startDate: '2026-09-10', endDate: '2026-09-15', currency: 'EUR' }],
    });

  it('blocks saving an existing expense whose date already falls outside the trip range', async () => {
    const user = userEvent.setup();
    renderView(tripWithLegs());
    await user.click(screen.getByRole('button', { name: /Edit expense/ }));

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByText(/Outside the trip/i)).toBeInTheDocument();
  });

  it('allows saving once the date is corrected to fall inside the trip range', async () => {
    const user = userEvent.setup();
    const { updateTrip } = renderView(tripWithLegs());
    await user.click(screen.getByRole('button', { name: /Edit expense/ }));
    await user.click(screen.getByRole('button', { name: /^Date: / }));
    await user.click(screen.getByRole('button', { name: /September 12, 2026/ }));

    expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(updateTrip).toHaveBeenCalled();
  });

  it('a brand-new expense within the trip range saves normally', async () => {
    const user = userEvent.setup();
    const { updateTrip } = renderView(makeTrip({ legs: [{ id: 'l1', city: 'Tokyo', country: 'Japan', startDate: '2026-09-10', endDate: '2026-09-15', currency: 'EUR' }] }));
    await user.click(screen.getByRole('button', { name: '+ New expense' }));
    await user.type(screen.getByLabelText('Amount'), '20');
    await user.click(screen.getByRole('button', { name: 'Food' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(updateTrip).toHaveBeenCalled();
  });
});
