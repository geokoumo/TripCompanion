import { useState } from 'react';
import type { Trip } from '../../trips/types';
import { CategoriesView } from './CategoriesView';
import { ExpensesView } from './ExpensesView';
import { SettleUpView } from './SettleUpView';
import styles from './BudgetTab.module.css';

type SubTab = 'categories' | 'expenses' | 'settleup';

const LABELS: Record<SubTab, string> = {
  categories: 'Κατηγορίες',
  expenses: 'Έξοδα',
  settleup: 'Εξόφληση',
};

interface BudgetTabProps {
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
}

export function BudgetTab({ trip, updateTrip }: BudgetTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('categories');

  return (
    <div style={{ paddingTop: 8 }}>
      <div className={styles.subTabs}>
        {(['categories', 'expenses', 'settleup'] as SubTab[]).map((tab) => (
          <button key={tab} type="button" className={styles.subTab} data-active={tab === subTab} onClick={() => setSubTab(tab)}>
            {LABELS[tab]}
          </button>
        ))}
      </div>
      {subTab === 'categories' && <CategoriesView trip={trip} updateTrip={updateTrip} />}
      {subTab === 'expenses' && <ExpensesView trip={trip} updateTrip={updateTrip} />}
      {subTab === 'settleup' && <SettleUpView trip={trip} />}
    </div>
  );
}
