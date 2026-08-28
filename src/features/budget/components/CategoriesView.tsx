import { useState } from 'react';
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
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(() => (trip.budget ? String(trip.budget) : ''));

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

  const saveBudget = () => {
    const value = Number(budgetInput.replace(',', '.'));
    setEditingBudget(false);
    if (!Number.isFinite(value) || value <= 0) return;
    void updateTrip((t) => ({ ...t, budget: value }));
  };

  const budgetTotal = trip.budget ?? 0;
  const pctOfBudget = budgetTotal > 0 ? (total / budgetTotal) * 100 : 0;
  const remaining = budgetTotal - total;
  const overBudget = budgetTotal > 0 && remaining < 0;
  const categoriesWithSpend = trip.budgetCategories.filter((c) => (spentByCategory.get(c.id) ?? 0) > 0);

  return (
    <div>
      <div className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <div>
            <div className={styles.summaryLabel}>Συνολικά δαπανήθηκαν</div>
            <div className={styles.summaryTotal}>
              {total.toFixed(2)} {trip.homeCurrency}
            </div>
          </div>
          <div className={styles.summaryBudgetCol}>
            <div className={styles.summaryLabel}>Προϋπολογισμός</div>
            {editingBudget ? (
              <input
                autoFocus
                className={styles.budgetInput}
                type="number"
                min={0}
                step="0.01"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                onBlur={saveBudget}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    saveBudget();
                  }
                }}
              />
            ) : (
              <button type="button" className={styles.summaryBudgetValue} onClick={() => setEditingBudget(true)}>
                {budgetTotal > 0 ? `${budgetTotal.toFixed(2)} ${trip.homeCurrency}` : 'Ορισμός'}
              </button>
            )}
          </div>
        </div>

        {unconvertedCount > 0 && (
          <div className={styles.unconvertedNote}>
            {unconvertedCount === 1 ? '1 έξοδο' : `${unconvertedCount} έξοδα`} χωρίς ισοτιμία — δεν προσμετρήθηκε στο σύνολο.
          </div>
        )}

        {categoriesWithSpend.length > 0 && (
          <div className={styles.segmentedBar}>
            {categoriesWithSpend.map((category) => {
              const spent = spentByCategory.get(category.id) ?? 0;
              const width = (spent / total) * 100;
              return <span key={category.id} className={styles.segment} data-color={category.color} style={{ width: `${width}%` }} />;
            })}
          </div>
        )}

        {budgetTotal > 0 && (
          <div className={styles.summaryFooterRow}>
            <span>{Math.round(pctOfBudget)}% του προϋπολογισμού</span>
            <span className={overBudget ? styles.overBudgetLabel : styles.remainingLabel}>
              {overBudget ? `${Math.abs(remaining).toFixed(2)} ${trip.homeCurrency} υπέρβαση` : `${remaining.toFixed(2)} ${trip.homeCurrency} απομένουν`}
            </span>
          </div>
        )}

        {trip.budgetCategories.length > 0 && (
          <div className={styles.legendRow}>
            {trip.budgetCategories.map((category) => (
              <span key={category.id} className={styles.legendItem}>
                <span className={styles.dot} data-color={category.color} />
                {category.name}
              </span>
            ))}
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
