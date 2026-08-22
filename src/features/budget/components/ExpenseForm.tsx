import { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { ChipSelect } from '../../../shared/components/ChipSelect';
import { DateField } from '../../../shared/components/DateField';
import { FieldRow, FieldWrapper, TextAreaField, TextField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';
import { generateId } from '../../../shared/lib/id';
import type { Traveler } from '../../travelers/types';
import type { Trip } from '../../trips/types';
import type { BudgetCategory, Expense } from '../types';

interface ExpenseFormProps {
  trip: Trip;
  categories: BudgetCategory[];
  travelers: Traveler[];
  initial?: Expense;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  onDelete?: () => void;
}

const emptyExpense = (trip: Trip, travelers: Traveler[]): Expense => ({
  id: generateId(),
  amount: 0,
  currency: trip.homeCurrency,
  categoryId: '',
  date: trip.startDate,
  paidBy: travelers[0]?.id ?? '',
  splitAmong: travelers.map((t) => t.id),
});

export function ExpenseForm({ trip, categories, travelers, initial, onClose, onSave, onDelete }: ExpenseFormProps) {
  const [expense, setExpense] = useState<Expense>(initial ?? emptyExpense(trip, travelers));

  const update = <K extends keyof Expense>(key: K, value: Expense[K]) => setExpense((prev) => ({ ...prev, [key]: value }));

  const toggleSplit = (id: string) => {
    update('splitAmong', expense.splitAmong.includes(id) ? expense.splitAmong.filter((s) => s !== id) : [...expense.splitAmong, id]);
  };

  const needsRate = expense.currency !== trip.homeCurrency;
  const canSave = expense.amount > 0 && expense.categoryId && expense.date && expense.paidBy && expense.splitAmong.length > 0;

  return (
    <Modal
      title={initial ? 'Επεξεργασία εξόδου' : 'Νέο έξοδο'}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <Button variant="danger" onClick={onDelete}>
              Διαγραφή
            </Button>
          )}
          <Button variant="primary" disabled={!canSave} onClick={() => onSave(expense)}>
            Αποθήκευση
          </Button>
        </>
      }
    >
      <FieldRow>
        <TextField
          label="Ποσό"
          autoFocus
          type="number"
          min={0}
          step="0.01"
          value={expense.amount || ''}
          onChange={(e) => update('amount', Number(e.target.value))}
        />
        <TextField label="Νόμισμα" value={expense.currency} onChange={(e) => update('currency', e.target.value.toUpperCase())} />
      </FieldRow>
      {needsRate && (
        <TextField
          label={`Ισοτιμία προς ${trip.homeCurrency}`}
          type="number"
          step="0.0001"
          value={expense.exchangeRateToHome ?? ''}
          onChange={(e) => update('exchangeRateToHome', e.target.value ? Number(e.target.value) : undefined)}
          placeholder="π.χ. 1.08"
        />
      )}

      {categories.length === 0 ? (
        <p style={{ color: 'var(--color-text-faint)' }}>Πρόσθεσε πρώτα μια κατηγορία στο tab «Κατηγορίες».</p>
      ) : (
        <FieldWrapper label="Κατηγορία">
          <ChipSelect options={categories.map((c) => ({ id: c.id, label: c.name }))} value={expense.categoryId} onChange={(id) => update('categoryId', id)} />
        </FieldWrapper>
      )}

      <DateField label="Ημερομηνία" date={expense.date} onChange={(d) => update('date', d)} minDate={trip.startDate} maxDate={trip.endDate} />

      {travelers.length > 0 && (
        <>
          <FieldWrapper label="Πλήρωσε">
            <ChipSelect options={travelers.map((t) => ({ id: t.id, label: t.name }))} value={expense.paidBy} onChange={(id) => update('paidBy', id)} />
          </FieldWrapper>
          <FieldWrapper label="Μοιράστηκε ανάμεσα σε">
            <ChipSelect options={travelers.map((t) => ({ id: t.id, label: t.name }))} value={expense.splitAmong} onChange={toggleSplit} multi />
          </FieldWrapper>
        </>
      )}

      <TextField label="Σύνδεσμος" value={expense.link ?? ''} onChange={(e) => update('link', e.target.value)} placeholder="https://…" />
      <TextAreaField label="Σημείωση" value={expense.note ?? ''} onChange={(e) => update('note', e.target.value)} />
    </Modal>
  );
}
