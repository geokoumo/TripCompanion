import styles from './Switch.module.css';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

/** The one iOS-style on/off switch used across the app — booking forms' "Add to itinerary", Settings' notification toggles. */
export function Switch({ checked, onChange, label, description }: SwitchProps) {
  const track = (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={styles.track} data-on={checked} onClick={() => onChange(!checked)}>
      <span className={styles.thumb} />
    </button>
  );

  if (!label) return track;

  return (
    <div className={styles.row}>
      <div className={styles.text}>
        <div className={styles.label}>{label}</div>
        {description && <div className={styles.description}>{description}</div>}
      </div>
      {track}
    </div>
  );
}
