import { useState } from 'react';
import { EmptyState } from '../../../shared/components/EmptyState';
import { generateId } from '../../../shared/lib/id';
import { deleteEntityWithUndo } from '../../../shared/lib/deleteWithUndo';
import type { Trip } from '../../trips/types';
import { saveMasterTemplate } from '../lib/templates';
import type { ChecklistItem } from '../types';
import { AddChecklistItemSheet } from './AddChecklistItemSheet';
import { CategorySection } from './CategorySection';
import { TravelerTabs } from './TravelerTabs';
import styles from './ChecklistTab.module.css';
import { useToast } from '../../../app/providers/ToastProvider';

interface ChecklistTabProps {
  trip: Trip;
  updateTrip: (updater: (t: Trip) => Trip) => Promise<void>;
}

export function ChecklistTab({ trip, updateTrip }: ChecklistTabProps) {
  const { showToast } = useToast();
  const [activeId, setActiveId] = useState(trip.travelers[0]?.id ?? '');
  const [adding, setAdding] = useState(false);

  if (trip.travelers.length === 0) {
    return <p style={{ color: 'var(--color-text-faint)', padding: '16px 0' }}>Δεν υπάρχουν ταξιδιώτες.</p>;
  }

  const activeTravelerId = trip.travelers.some((t) => t.id === activeId) ? activeId : trip.travelers[0]!.id;
  const items = trip.checklistItems.filter((i) => i.travelerId === activeTravelerId);
  const doneCount = items.filter((i) => i.done).length;
  const progress = items.length > 0 ? (doneCount / items.length) * 100 : 0;

  const byCategory = new Map<string, ChecklistItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  const toggle = (id: string) =>
    void updateTrip((t) => ({
      ...t,
      checklistItems: t.checklistItems.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    }));

  const remove = (id: string) => deleteEntityWithUndo({ updateTrip, showToast, arrayKey: 'checklistItems', id });

  const addItem = (values: Pick<ChecklistItem, 'text' | 'category' | 'quantity'>) => {
    const item: ChecklistItem = { id: generateId(), travelerId: activeTravelerId, done: false, ...values };
    void updateTrip((t) => ({ ...t, checklistItems: [...t.checklistItems, item] }));
    setAdding(false);
  };

  const saveAsTemplate = () => {
    saveMasterTemplate(items);
    showToast('Αποθηκεύτηκε ως πρότυπο.');
  };

  return (
    <div style={{ paddingTop: 8 }}>
      <TravelerTabs travelers={trip.travelers} activeId={activeTravelerId} onChange={setActiveId} />

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {items.length === 0 && <EmptyState headline="Άδεια βαλίτσα" body="Πρόσθεσε αντικείμενα ή ξεκίνα από ένα πρότυπο." />}

      {[...byCategory.entries()].map(([category, categoryItems]) => (
        <CategorySection key={category} category={category} items={categoryItems} onToggle={toggle} onRemove={remove} />
      ))}

      <button type="button" className={styles.addButton} onClick={() => setAdding(true)}>
        + Νέο αντικείμενο
      </button>

      <div className={styles.footerActions}>
        <button type="button" className={styles.linkButton} onClick={saveAsTemplate}>
          Αποθήκευση ως πρότυπο
        </button>
      </div>

      {adding && <AddChecklistItemSheet onClose={() => setAdding(false)} onSave={addItem} />}
    </div>
  );
}
