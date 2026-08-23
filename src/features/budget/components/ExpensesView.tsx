import { useState } from 'react';
import { useToast } from '../../../app/providers/ToastProvider';
import { AvatarChip } from '../../../shared/components/AvatarChip';
import { DeleteConfirmSheet } from '../../../shared/components/ConfirmDialog';
import { deleteEntityWithUndo } from '../../../shared/lib/deleteWithUndo';
import { formatDateNoYear } from '../../../shared/lib/dateFormat';
import type { Trip } from '../../trips/types';
import { expenseAmountInHome } from '../lib/currency';
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
    showToast('Το έξοδο καταγράφηκε.');
    setEditing(null);
    setCreating(false);
  };

  const remove = (id: string) => {
    deleteEntityWithUndo({ updateTrip, showToast, arrayKey: 'expenses', id });
    setPendingDelete(null);
    setEditing(null);
  };

  return (
    <div>
      {sorted.length === 0 && (
        <p style={{ color: 'var(--color-text-faint)', padding: '16px 0' }}>
          Κανένα έξοδο
          <br />
          Κατέγραψε το πρώτο έξοδο σε δέκα δευτερόλεπτα.
        </p>
      )}
      {sorted.map((expense) => {
        const category = trip.budgetCategories.find((c) => c.id === expense.categoryId);
        const payer = trip.travelers.find((t) => t.id === expense.paidBy);
        const amountHome = expenseAmountInHome(expense, trip.homeCurrency);
        const differsCurrency = expense.currency !== trip.homeCurrency;
        const splitLabel = expense.splitAmong.length <= 1 ? 'ατομικό' : `/${expense.splitAmong.length}`;
        return (
          <div key={expense.id} className={styles.row} onClick={() => setEditing(expense)}>
            <div className={styles.left}>
              {payer && <AvatarChip name={payer.name} color={payer.avatarColor} size="sm" />}
              <div>
                <div className={styles.description}>{expense.note || category?.name || 'Έξοδο'}</div>
                <div className={styles.meta}>
                  {formatDateNoYear(expense.date)} · {category?.name ?? '—'} · {splitLabel}
                </div>
              </div>
            </div>
            <div className={styles.amountBlock}>
              <span className={styles.amount}>
                {amountHome.toFixed(2)} {trip.homeCurrency}
              </span>
              {differsCurrency && (
                <span className={styles.originalAmount}>
                  {expense.amount.toFixed(2)} {expense.currency}
                </span>
              )}
            </div>
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
          updateTrip={updateTrip}
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
        <DeleteConfirmSheet
          itemName={pendingDelete.note || 'το έξοδο'}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => remove(pendingDelete.id)}
        />
      )}
    </div>
  );
}
