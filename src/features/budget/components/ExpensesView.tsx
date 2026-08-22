import { useState } from 'react';
import { useToast } from '../../../app/providers/ToastProvider';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { formatDateNoYear } from '../../../shared/lib/dateFormat';
import type { Trip } from '../../trips/types';
import type { Expense } from '../types';
import { ExpenseForm } from './ExpenseForm';
import styles from './ExpensesView.module.css';

interface ExpensesViewProps {
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
}

export function ExpensesView({ trip, updateTrip }: ExpensesViewProps) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState<Expense | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);

  const sorted = [...trip.expenses].sort((a, b) => b.date.localeCompare(a.date));

  const save = async (expense: Expense) => {
    await updateTrip((t) => {
      const exists = t.expenses.some((e) => e.id === expense.id);
      return { ...t, expenses: exists ? t.expenses.map((e) => (e.id === expense.id ? expense : e)) : [...t.expenses, expense] };
    });
    showToast('Το έξοδο αποθηκεύτηκε', 'success');
    setEditing(null);
    setCreating(false);
  };

  const remove = async (id: string) => {
    await updateTrip((t) => ({ ...t, expenses: t.expenses.filter((e) => e.id !== id) }));
    setPendingDelete(null);
    setEditing(null);
    showToast('Το έξοδο διαγράφηκε', 'success');
  };

  return (
    <div>
      {sorted.length === 0 && <p style={{ color: 'var(--color-text-faint)', padding: '16px 0' }}>Δεν έχουν καταγραφεί έξοδα ακόμα.</p>}
      {sorted.map((expense) => {
        const category = trip.budgetCategories.find((c) => c.id === expense.categoryId);
        return (
          <div key={expense.id} className={styles.row} onClick={() => setEditing(expense)}>
            <div className={styles.left}>
              <span className={styles.categoryLabel}>{category?.name ?? '—'}</span>
              <span className={styles.note}>
                {formatDateNoYear(expense.date)} {expense.note ? `· ${expense.note}` : ''}
              </span>
            </div>
            <span className={styles.amount}>
              {expense.amount.toFixed(2)} {expense.currency}
            </span>
          </div>
        );
      })}

      <button type="button" className={styles.addButton} onClick={() => setCreating(true)}>
        + Νέο έξοδο
      </button>

      {(creating || editing) && (
        <ExpenseForm
          trip={trip}
          categories={trip.budgetCategories}
          travelers={trip.travelers}
          initial={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={(e) => void save(e)}
          onDelete={editing ? () => setPendingDelete(editing) : undefined}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Διαγραφή εξόδου"
          message="Θα διαγραφεί αυτό το έξοδο."
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void remove(pendingDelete.id)}
        />
      )}
    </div>
  );
}
