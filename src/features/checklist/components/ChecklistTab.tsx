import { useState } from 'react';
import { CHECKLIST_CATEGORIES } from '../../../config/constants';
import { PresetChips } from '../../../shared/components/PresetChips';
import { generateId } from '../../../shared/lib/id';
import type { Trip } from '../../trips/types';
import { saveMasterTemplate } from '../lib/templates';
import type { ChecklistItem } from '../types';
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
  const [newItemText, setNewItemText] = useState('');

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

  const remove = (id: string) =>
    void updateTrip((t) => ({ ...t, checklistItems: t.checklistItems.filter((i) => i.id !== id) }));

  const addItem = (category: string) => {
    const text = newItemText.trim();
    if (!text) return;
    const item: ChecklistItem = { id: generateId(), travelerId: activeTravelerId, text, category, quantity: 1, done: false };
    void updateTrip((t) => ({ ...t, checklistItems: [...t.checklistItems, item] }));
    setNewItemText('');
  };

  const saveAsTemplate = () => {
    saveMasterTemplate(items);
    showToast('Αποθηκεύτηκε ως πρότυπο', 'success');
  };

  return (
    <div style={{ paddingTop: 8 }}>
      <TravelerTabs travelers={trip.travelers} activeId={activeTravelerId} onChange={setActiveId} />

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {items.length === 0 && <p style={{ color: 'var(--color-text-faint)' }}>Δεν υπάρχουν αντικείμενα ακόμα.</p>}

      {[...byCategory.entries()].map(([category, categoryItems]) => (
        <CategorySection key={category} category={category} items={categoryItems} onToggle={toggle} onRemove={remove} />
      ))}

      <div className={styles.addRow}>
        <input
          className={styles.addInput}
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newItemText.trim()) {
              e.preventDefault();
              addItem('Λοιπά');
            }
          }}
          placeholder="Νέο αντικείμενο…"
        />
      </div>
      {newItemText.trim() && (
        <div style={{ marginTop: 8 }}>
          <PresetChips presets={CHECKLIST_CATEGORIES} onSelect={addItem} freeTextPlaceholder="Άλλη κατηγορία…" />
        </div>
      )}

      <div className={styles.footerActions}>
        <button type="button" className={styles.linkButton} onClick={saveAsTemplate}>
          Αποθήκευση ως πρότυπο
        </button>
      </div>
    </div>
  );
}
