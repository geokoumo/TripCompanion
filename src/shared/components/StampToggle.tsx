import type { ReactElement } from 'react';
import styles from './StampToggle.module.css';

interface Option<T extends string> {
  id: T;
  label: string;
  Icon?: (props: { size?: number }) => ReactElement;
}

interface StampToggleProps<T extends string> {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 'stamp' (default) is the mono/uppercase status-picker look; 'plain' is body text for navigation-style tabs. */
  variant?: 'stamp' | 'plain';
  /** 'wrap' (default) wraps onto multiple lines; 'scroll' is a single horizontally-scrolling row; 'fill' makes every option equal-width, filling the row. */
  layout?: 'wrap' | 'scroll' | 'fill';
}

/** The one segmented-control pattern — a status picker, a scrollable type switcher, or equal-width navigation tabs are all this component with different `variant`/`layout` props, never a new one-off pill row. */
export function StampToggle<T extends string>({ options, value, onChange, variant = 'stamp', layout = 'wrap' }: StampToggleProps<T>) {
  return (
    <div className={styles.group} data-layout={layout} role="radiogroup">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={option.id === value}
          className={styles.option}
          data-active={option.id === value}
          data-variant={variant}
          onClick={() => onChange(option.id)}
        >
          {option.Icon && <option.Icon size={15} />}
          {option.label}
        </button>
      ))}
    </div>
  );
}
