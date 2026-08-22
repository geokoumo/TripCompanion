import { useState } from 'react';
import { ITINERARY_STOP_TYPES } from '../../../config/constants';
import { formatDateNoYear } from '../../../shared/lib/dateFormat';
import { generateId } from '../../../shared/lib/id';
import type { Idea } from '../types';
import styles from './IdeasBacklog.module.css';

interface IdeasBacklogProps {
  ideas: Idea[];
  defaultDate: string;
  onAdd: (idea: Idea) => void;
  onAssignToDay: (idea: Idea) => void;
  onRemove: (id: string) => void;
}

export function IdeasBacklog({ ideas, defaultDate, onAdd, onAssignToDay, onRemove }: IdeasBacklogProps) {
  const [open, setOpen] = useState(true);
  const [newTitle, setNewTitle] = useState('');

  const addIdea = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onAdd({ id: generateId(), title: trimmed, type: 'sight' });
    setNewTitle('');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header} onClick={() => setOpen((v) => !v)}>
        <span className={styles.headerTitle}>Ιδέες ({ideas.length})</span>
        <span className={styles.chevron}>{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <>
          {ideas.map((idea) => {
            const type = ITINERARY_STOP_TYPES.find((t) => t.id === idea.type);
            return (
              <div key={idea.id} className={styles.row}>
                <span className={styles.badge}>{type?.letter}</span>
                <span className={styles.rowTitle} onClick={() => onRemove(idea.id)} title="Πάτα για διαγραφή">
                  {idea.title}
                </span>
                <button type="button" className={styles.dateChip} onClick={() => onAssignToDay(idea)}>
                  Στις {formatDateNoYear(idea.suggestedDate ?? defaultDate)}
                </button>
              </div>
            );
          })}
          <div className={styles.addRow}>
            <input
              className={styles.addInput}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addIdea();
                }
              }}
              placeholder="Νέα ιδέα…"
            />
          </div>
        </>
      )}
    </div>
  );
}
