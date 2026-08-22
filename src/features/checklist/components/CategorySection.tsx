import { useState } from 'react';
import type { ChecklistItem } from '../types';
import styles from './ChecklistTab.module.css';

interface CategorySectionProps {
  category: string;
  items: ChecklistItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

export function CategorySection({ category, items, onToggle, onRemove }: CategorySectionProps) {
  const [open, setOpen] = useState(true);
  const doneCount = items.filter((i) => i.done).length;

  return (
    <div>
      <div className={styles.categoryHeader} onClick={() => setOpen((v) => !v)}>
        <span className={styles.categoryTitle}>
          {category.toUpperCase()} {doneCount}/{items.length}
        </span>
        <span style={{ color: 'var(--color-text-faint)' }}>{open ? '▾' : '▸'}</span>
      </div>
      {open &&
        items.map((item) => (
          <div key={item.id} className={styles.item}>
            <input type="checkbox" checked={item.done} onChange={() => onToggle(item.id)} />
            <span className={styles.itemText} data-done={item.done}>
              {item.text}
            </span>
            {item.quantity > 1 && <span className={styles.quantity}>×{item.quantity}</span>}
            <button type="button" className={styles.removeButton} onClick={() => onRemove(item.id)} aria-label="Διαγραφή">
              ✕
            </button>
          </div>
        ))}
    </div>
  );
}
