import { useState } from 'react';
import { CATEGORY_COLORS } from '../../../config/constants';
import { Button } from '../../../shared/components/Button';
import { ChipSelect } from '../../../shared/components/ChipSelect';
import { DateField } from '../../../shared/components/DateField';
import { FieldWrapper, MoreToggle, TextField } from '../../../shared/components/Field';
import { Modal } from '../../../shared/components/Modal';
import { generateId } from '../../../shared/lib/id';
import type { Traveler } from '../../travelers/types';
import { getTripDateRange } from '../../trips/lib/dateRange';
import type { Trip } from '../../trips/types';
import type { BudgetCategory, Expense } from '../types';

interface ExpenseFormProps {
  trip: Trip;
  categories: BudgetCategory[];
  travelers: Traveler[];
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
  initial?: Expense;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  onDelete?: () => void;
}

const OTHER = '__other__';
const CURRENCY_OTHER = '__other_currency__';

const emptyExpense = (trip: Trip, travelers: Traveler[]): Expense => ({
  id: generateId(),
  amount: 0,
  currency: trip.homeCurrency,
  categoryId: '',
  date: getTripDateRange(trip.legs, trip.flights)?.startDate ?? '',
  paidBy: travelers[0]?.id ?? '',
  splitAmong: travelers.map((t) => t.id),
});

export function ExpenseForm({ trip, categories, travelers, updateTrip, initial, onClose, onSave, onDelete }: ExpenseFormProps) {
  const [expense, setExpense] = useState<Expense>(initial ?? emptyExpense(trip, travelers));
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showMore, setShowMore] = useState(Boolean(initial?.link));
  const range = getTripDateRange(trip.legs, trip.flights);

  const knownCurrencies = Array.from(new Set([trip.homeCurrency, ...trip.legs.map((l) => l.currency)]));
  const [creatingCurrency, setCreatingCurrency] = useState(() => !knownCurrencies.includes(expense.currency));

  const update = <K extends keyof Expense>(key: K, value: Expense[K]) => setExpense((prev) => ({ ...prev, [key]: value }));

  const toggleSplit = (id: string) => {
    update('splitAmong', expense.splitAmong.includes(id) ? expense.splitAmong.filter((s) => s !== id) : [...expense.splitAmong, id]);
  };

  const confirmNewCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const color = CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length]!;
    const category: BudgetCategory = { id: generateId(), name, color };
    await updateTrip((t) => ({ ...t, budgetCategories: [...t.budgetCategories, category] }));
    update('categoryId', category.id);
    setCreatingCategory(false);
    setNewCategoryName('');
  };

  const needsRate = expense.currency !== trip.homeCurrency;
  const hasRate = !needsRate || (expense.exchangeRateToHome !== undefined && expense.exchangeRateToHome > 0);
  const canSave = expense.amount > 0 && expense.categoryId && expense.date && expense.paidBy && expense.splitAmong.length > 0 && hasRate;

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
      <TextField
        label="Ποσό"
        autoFocus
        type="number"
        min={0}
        step="0.01"
        value={expense.amount || ''}
        onChange={(e) => update('amount', Number(e.target.value))}
      />

      <FieldWrapper label="Νόμισμα">
        <ChipSelect
          options={[...knownCurrencies.map((c) => ({ id: c, label: c })), { id: CURRENCY_OTHER, label: 'Άλλο' }]}
          value={creatingCurrency ? CURRENCY_OTHER : expense.currency}
          onChange={(id) => {
            if (id === CURRENCY_OTHER) {
              setCreatingCurrency(true);
            } else {
              setCreatingCurrency(false);
              update('currency', id);
            }
          }}
        />
      </FieldWrapper>
      {creatingCurrency && (
        <TextField
          label="Άλλο νόμισμα"
          autoFocus
          value={expense.currency}
          onChange={(e) => update('currency', e.target.value.toUpperCase())}
          placeholder="π.χ. THB"
        />
      )}

      {needsRate && (
        <TextField
          label={`Ισοτιμία προς ${trip.homeCurrency}`}
          type="number"
          step="0.0001"
          value={expense.exchangeRateToHome ?? ''}
          onChange={(e) => update('exchangeRateToHome', e.target.value ? Number(e.target.value) : undefined)}
          placeholder="π.χ. 1.08"
          error={!hasRate ? 'Χρειάζεται ισοτιμία πριν αποθηκευτεί το έξοδο.' : undefined}
        />
      )}

      <FieldWrapper label="Κατηγορία">
        <ChipSelect
          options={[...categories.map((c) => ({ id: c.id, label: c.name })), { id: OTHER, label: 'Άλλο' }]}
          value={creatingCategory ? OTHER : expense.categoryId}
          onChange={(id) => {
            if (id === OTHER) {
              setCreatingCategory(true);
            } else {
              setCreatingCategory(false);
              update('categoryId', id);
            }
          }}
        />
      </FieldWrapper>
      {creatingCategory && (
        <TextField
          label="Νέα κατηγορία"
          autoFocus
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void confirmNewCategory();
            }
          }}
          placeholder="π.χ. Σουβενίρ"
        />
      )}

      <TextField label="Περιγραφή" value={expense.note ?? ''} onChange={(e) => update('note', e.target.value)} placeholder="π.χ. Δείπνο" />

      <DateField label="Ημερομηνία" date={expense.date} onChange={(d) => update('date', d)} minDate={range?.startDate} maxDate={range?.endDate} />

      {travelers.length > 0 && (
        <FieldWrapper label="Πλήρωσε">
          <ChipSelect options={travelers.map((t) => ({ id: t.id, label: t.name }))} value={expense.paidBy} onChange={(id) => update('paidBy', id)} />
        </FieldWrapper>
      )}
      {travelers.length > 1 && (
        <FieldWrapper label="Μοιράστηκε ανάμεσα σε">
          <ChipSelect options={travelers.map((t) => ({ id: t.id, label: t.name }))} value={expense.splitAmong} onChange={toggleSplit} multi />
        </FieldWrapper>
      )}

      <MoreToggle open={showMore} onToggle={() => setShowMore((v) => !v)} />
      {showMore && <TextField label="Σύνδεσμος απόδειξης" value={expense.link ?? ''} onChange={(e) => update('link', e.target.value)} placeholder="https://…" />}
    </Modal>
  );
}
