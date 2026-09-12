import type { Trip } from '../../features/trips/types';
import type { Expense } from '../../features/budget/types';

/**
 * Pure entity-level operations on a trip's expenses — no Supabase call of
 * its own. Every trip write still goes through the one atomic
 * upsert_full_trip transaction (see SupabaseTripRepository/TripRepository);
 * this exists so components compose a new Trip via a named, tested
 * function instead of inlining the same array-splice logic per screen.
 */

/** Inserts a new expense, or replaces the one with a matching id. */
export function upsertExpense(trip: Trip, expense: Expense): Trip {
  const exists = trip.expenses.some((e) => e.id === expense.id);
  return {
    ...trip,
    expenses: exists ? trip.expenses.map((e) => (e.id === expense.id ? expense : e)) : [...trip.expenses, expense],
  };
}
