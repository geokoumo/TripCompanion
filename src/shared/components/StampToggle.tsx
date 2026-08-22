import styles from './StampToggle.module.css';

interface Option<T extends string> {
  id: T;
  label: string;
}

interface StampToggleProps<T extends string> {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function StampToggle<T extends string>({ options, value, onChange }: StampToggleProps<T>) {
  return (
    <div className={styles.group} role="radiogroup">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={option.id === value}
          className={styles.option}
          data-active={option.id === value}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
