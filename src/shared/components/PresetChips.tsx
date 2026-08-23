import { useState } from 'react';
import styles from './PresetChips.module.css';

interface PresetChipsProps {
  presets: readonly string[];
  onSelect: (value: string) => void;
  freeTextPlaceholder?: string;
  hideInput?: boolean;
}

/** Dashed pre-fill chips — tapping fills a value but never auto-submits. Free-text fallback below unless hidden. */
export function PresetChips({ presets, onSelect, freeTextPlaceholder = 'Άλλο…', hideInput = false }: PresetChipsProps) {
  const [customValue, setCustomValue] = useState('');

  const submitCustom = () => {
    const trimmed = customValue.trim();
    if (trimmed) {
      onSelect(trimmed);
      setCustomValue('');
    }
  };

  return (
    <div>
      <div className={styles.group}>
        {presets.map((preset) => (
          <button key={preset} type="button" className={styles.chip} onClick={() => onSelect(preset)}>
            {preset}
          </button>
        ))}
      </div>
      {!hideInput && (
        <input
          type="text"
          className={styles.input}
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submitCustom();
            }
          }}
          placeholder={freeTextPlaceholder}
        />
      )}
    </div>
  );
}
