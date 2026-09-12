import { describe, expect, it } from 'vitest';
import { upsertExpense } from './expenseRepository';
import type { Trip } from '../../features/trips/types';
import type { Expense } from '../../features/budget/types';

function makeTrip(): Trip {
  return {
    id: 'trip1',
    title: 'Test Trip',
    homeCurrency: 'EUR',
    archived: false,
    description: null,
    travelers: [],
    legs: [],
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
    createdAt: '2026-09-01',
  };
}

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'e1',
    amount: 20,
    currency: 'EUR',
    categoryId: 'food',
    date: '2026-09-05',
    paidBy: 't1',
    splitAmong: ['t1'],
    ...overrides,
  };
}

describe('upsertExpense', () => {
  it('adds a new expense when no id matches', () => {
    const trip = makeTrip();
    const expense = makeExpense();
    const result = upsertExpense(trip, expense);
    expect(result.expenses).toEqual([expense]);
    expect(trip.expenses).toEqual([]); // input untouched
  });

  it('replaces the expense with a matching id, leaving others alone', () => {
    const trip = { ...makeTrip(), expenses: [makeExpense({ id: 'e1', amount: 10 }), makeExpense({ id: 'e2', amount: 30 })] };
    const updated = makeExpense({ id: 'e1', amount: 99 });
    const result = upsertExpense(trip, updated);
    expect(result.expenses).toEqual([updated, makeExpense({ id: 'e2', amount: 30 })]);
  });
});
