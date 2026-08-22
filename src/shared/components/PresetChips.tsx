import { useState } from 'react';
import styles from './ChipSelect.module.css';

interface PresetChipsProps {
  presets: readonly string[];
  onSelect: (value: string) => void;
  freeTextPlaceholder?: string;
}

/** Chips for common presets, plus a free-text fallback input — never the only interaction. */
export function PresetChips({ presets, onSelect, freeTextPlaceholder = 'Άλλο…' }: PresetChipsProps) {
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
      <input
        type="text"
        value={customValue}
        onChange={(e) => setCustomValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submitCustom();
          }
        }}
        placeholder={freeTextPlaceholder}
        style={{
          marginTop: 8,
          width: '100%',
          padding: '8px 12px',
          borderRadius: 10,
          border: '1.5px solid var(--color-border-strong)',
          background: 'var(--color-surface)',
        }}
      />
    </div>
  );
}
