import { BUDGET_CATEGORY_PRESETS, CATEGORY_COLORS } from '../../../config/constants';
import { PresetChips } from '../../../shared/components/PresetChips';
import { generateId } from '../../../shared/lib/id';
import type { Trip } from '../../trips/types';
import { expenseAmountInHome } from '../lib/currency';
import type { BudgetCategory } from '../types';
import styles from './CategoriesView.module.css';

interface CategoriesViewProps {
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
}

export function CategoriesView({ trip, updateTrip }: CategoriesViewProps) {
  const spentByCategory = new Map<string, number>();
  let total = 0;
  let unconvertedCount = 0;
  for (const expense of trip.expenses) {
    const amountHome = expenseAmountInHome(expense, trip.homeCurrency);
    if (amountHome === null) {
      unconvertedCount += 1;
      continue;
    }
    total += amountHome;
    spentByCategory.set(expense.categoryId, (spentByCategory.get(expense.categoryId) ?? 0) + amountHome);
  }

  const addCategory = (name: string) => {
    if (trip.budgetCategories.some((c) => c.name === name)) return;
    const color = CATEGORY_COLORS[trip.budgetCategories.length % CATEGORY_COLORS.length]!;
    const category: BudgetCategory = { id: generateId(), name, color };
    void updateTrip((t) => ({ ...t, budgetCategories: [...t.budgetCategories, category] }));
  };

  return (
    <div>
      <div className={styles.totalCard}>
        <div className={styles.totalLabel}>Σύνολο</div>
        <div className={styles.totalValue}>
          {total.toFixed(2)} {trip.homeCurrency}
        </div>
        {unconvertedCount > 0 && (
          <div className={styles.unconvertedNote}>
            {unconvertedCount === 1 ? '1 έξοδο' : `${unconvertedCount} έξοδα`} χωρίς ισοτιμία — δεν προσμετρήθηκε στο σύνολο.
          </div>
        )}
      </div>

      {trip.budgetCategories.map((category) => {
        const spent = spentByCategory.get(category.id) ?? 0;
        const pct = total > 0 ? (spent / total) * 100 : 0;
        return (
          <div key={category.id} className={styles.categoryCard}>
            <div className={styles.categoryTop}>
              <span className={styles.categoryName}>
                <span className={styles.dot} data-color={category.color} />
                {category.name}
              </span>
              <span className={styles.categoryAmount}>
                {spent.toFixed(2)} {trip.homeCurrency}
              </span>
            </div>
            <div className={styles.barTrack}>
              <div className={styles.barFill} data-color={category.color} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}

      <div className={styles.addSection}>
        <PresetChips presets={BUDGET_CATEGORY_PRESETS} onSelect={addCategory} freeTextPlaceholder="Νέα κατηγορία…" />
      </div>
    </div>
  );
}
