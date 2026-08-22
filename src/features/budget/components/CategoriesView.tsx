import { useState } from 'react';
import { BUDGET_CATEGORY_PRESETS, CATEGORY_COLORS } from '../../../config/constants';
import { PresetChips } from '../../../shared/components/PresetChips';
import { TextField } from '../../../shared/components/Field';
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
  const [newLimit, setNewLimit] = useState('');

  const spentByCategory = new Map<string, number>();
  let total = 0;
  for (const expense of trip.expenses) {
    const amountHome = expenseAmountInHome(expense, trip.homeCurrency);
    total += amountHome;
    spentByCategory.set(expense.categoryId, (spentByCategory.get(expense.categoryId) ?? 0) + amountHome);
  }

  const addCategory = (name: string) => {
    if (trip.budgetCategories.some((c) => c.name === name)) return;
    const color = CATEGORY_COLORS[trip.budgetCategories.length % CATEGORY_COLORS.length]!;
    const category: BudgetCategory = {
      id: generateId(),
      name,
      color,
      limit: newLimit ? Number(newLimit) : undefined,
    };
    void updateTrip((t) => ({ ...t, budgetCategories: [...t.budgetCategories, category] }));
    setNewLimit('');
  };

  return (
    <div>
      <div className={styles.totalCard}>
        <div className={styles.totalLabel}>Σύνολο εξόδων</div>
        <div className={styles.totalValue}>
          {total.toFixed(2)} {trip.homeCurrency}
        </div>
      </div>

      {trip.budgetCategories.map((category) => {
        const spent = spentByCategory.get(category.id) ?? 0;
        const pct = category.limit ? Math.min(100, (spent / category.limit) * 100) : 0;
        return (
          <div key={category.id} className={styles.categoryCard}>
            <div className={styles.categoryTop}>
              <span className={styles.categoryName}>
                <span className={styles.dot} data-color={category.color} />
                {category.name}
              </span>
              <span className={styles.categoryAmount}>
                {spent.toFixed(2)} {trip.homeCurrency}
                {category.limit ? ` / ${category.limit}` : ''}
              </span>
            </div>
            {category.limit && (
              <div className={styles.barTrack}>
                <div className={styles.barFill} data-color={category.color} style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>
        );
      })}

      <div className={styles.addSection}>
        <TextField label="Όριο νέας κατηγορίας (προαιρετικό)" type="number" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} />
        <PresetChips presets={BUDGET_CATEGORY_PRESETS} onSelect={addCategory} freeTextPlaceholder="Νέα κατηγορία…" />
      </div>
    </div>
  );
}
