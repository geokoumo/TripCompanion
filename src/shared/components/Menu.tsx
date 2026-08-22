import { useState } from 'react';
import styles from './Menu.module.css';

export interface MenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

export function Menu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <span className={styles.wrapper}>
      <button
        type="button"
        className={styles.trigger}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Περισσότερα"
      >
        ···
      </button>
      {open && (
        <>
          <div className={styles.backdrop} onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                className={styles.item}
                data-danger={item.danger}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </span>
  );
}
