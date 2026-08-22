import type { ReactNode } from 'react';
import styles from './ChipSelect.module.css';

interface ChipOption<T extends string> {
  id: T;
  label: ReactNode;
}

interface ChipSelectProps<T extends string> {
  options: readonly ChipOption<T>[];
  value: T | T[];
  onChange: (value: T) => void;
  multi?: boolean;
}

export function ChipSelect<T extends string>({ options, value, onChange, multi = false }: ChipSelectProps<T>) {
  const isActive = (id: T) => (multi ? (value as T[]).includes(id) : value === id);
  return (
    <div className={styles.group}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={styles.chip}
          data-active={isActive(option.id)}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
