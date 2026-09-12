import { useState } from 'react';
import { StampToggle } from '../../../shared/components/StampToggle';
import type { Trip } from '../../trips/types';
import { CategoriesView } from './CategoriesView';
import { ExpensesView } from './ExpensesView';
import { SettleUpView } from './SettleUpView';

type SubTab = 'categories' | 'expenses' | 'settleup';

const OPTIONS: { id: SubTab; label: string }[] = [
  { id: 'categories', label: 'Categories' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'settleup', label: 'Settle up' },
];

interface BudgetTabProps {
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
}

export function BudgetTab({ trip, updateTrip }: BudgetTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('categories');

  return (
    <div style={{ paddingTop: 8 }}>
      <div style={{ margin: 'var(--space-3) 0 var(--space-4)' }}>
        <StampToggle options={OPTIONS} value={subTab} onChange={setSubTab} variant="plain" layout="fill" />
      </div>
      {subTab === 'categories' && <CategoriesView trip={trip} updateTrip={updateTrip} />}
      {subTab === 'expenses' && <ExpensesView trip={trip} updateTrip={updateTrip} />}
      {subTab === 'settleup' && <SettleUpView trip={trip} />}
    </div>
  );
}
