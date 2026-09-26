import { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import type { Trip } from '../../trips/types';
import { computeTotalSpent } from '../lib/currency';
import { CategoriesView } from './CategoriesView';
import { ExpensesView } from './ExpensesView';
import { SettleUpView } from './SettleUpView';
import styles from './BudgetTab.module.css';

type View = 'overview' | 'categories' | 'expenses' | 'settleup';

interface BudgetTabProps {
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<{ ok: boolean } | void>;
}

/**
 * Budget landing screen: a Trip Spending summary (Spent/Budget/Remaining,
 * all real fields — trip.budget is the same value CategoriesView already
 * lets the user set), then rows linking into the existing Expenses/
 * Categories/Settle-up views verbatim. No "Your Balance" line here — the
 * app has no concept of which Traveler is the signed-in user, so a
 * personalized balance would be an invented association Settle Up itself
 * correctly avoids by listing every traveler's balance instead.
 */
export function BudgetTab({ trip, updateTrip }: BudgetTabProps) {
  const [view, setView] = useState<View>('overview');

  if (view !== 'overview') {
    const titles: Record<Exclude<View, 'overview'>, string> = { categories: 'Categories', expenses: 'Expenses', settleup: 'Settle Up' };
    return (
      <div style={{ paddingTop: 8 }}>
        <button type="button" className={styles.backLink} onClick={() => setView('overview')}>
          ‹ Budget
        </button>
        <h1 className={styles.subScreenTitle}>{titles[view]}</h1>
        {view === 'categories' && <CategoriesView trip={trip} updateTrip={updateTrip} />}
        {view === 'expenses' && <ExpensesView trip={trip} updateTrip={updateTrip} />}
        {view === 'settleup' && <SettleUpView trip={trip} />}
      </div>
    );
  }

  const { total, unconvertedCount } = computeTotalSpent(trip.expenses, trip.homeCurrency);
  const budgetTotal = trip.budget ?? 0;
  const remaining = budgetTotal - total;
  const categoryNames = trip.budgetCategories.map((c) => c.name).join(', ');

  return (
    <div style={{ paddingTop: 8 }}>
      <h1 className={styles.title}>Budget</h1>

      <div className={styles.spendingCard}>
        <div className={styles.spendingHeader}>
          <span className={styles.eyebrow}>Trip Spending</span>
          <Button variant="secondary" onClick={() => setView('expenses')} style={{ flex: 'none' }}>
            + Add expense
          </Button>
        </div>

        <div className={styles.statRow}>
          <span className={styles.statLabel}>Spent</span>
          <span className={styles.statValue}>
            {total.toFixed(2)} {trip.homeCurrency}
          </span>
        </div>
        {budgetTotal > 0 && (
          <>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Budget</span>
              <span className={styles.statValue}>
                {budgetTotal.toFixed(2)} {trip.homeCurrency}
              </span>
            </div>
            <div className={styles.statRowDivider} />
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Remaining</span>
              <span className={remaining < 0 ? styles.statValueDanger : styles.statValueAccent}>
                {remaining.toFixed(2)} {trip.homeCurrency}
              </span>
            </div>
          </>
        )}
        {unconvertedCount > 0 && (
          <p className={styles.unconvertedNote}>
            {unconvertedCount === 1 ? '1 expense' : `${unconvertedCount} expenses`} without a rate — not counted above.
          </p>
        )}
      </div>

      <button type="button" className={styles.linkRow} onClick={() => setView('expenses')}>
        <span className={styles.linkRowEyebrow}>Expenses</span>
        <span className={styles.linkRowTitle}>{trip.expenses.length} {trip.expenses.length === 1 ? 'entry' : 'entries'}</span>
        <span className={styles.linkRowMeta}>Review recent costs</span>
      </button>

      <button type="button" className={styles.linkRow} onClick={() => setView('categories')}>
        <span className={styles.linkRowEyebrow}>Categories</span>
        <span className={styles.linkRowTitle}>{trip.budgetCategories.length} {trip.budgetCategories.length === 1 ? 'group' : 'groups'}</span>
        {categoryNames && <span className={styles.linkRowMeta}>{categoryNames}</span>}
      </button>

      <button type="button" className={styles.linkRow} onClick={() => setView('settleup')}>
        <span className={styles.linkRowTitleOnly}>Settle up</span>
        <span className={styles.linkRowMeta}>Record payments between group members</span>
      </button>
    </div>
  );
}
