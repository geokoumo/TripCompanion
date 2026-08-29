import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import styles from './Field.module.css';

interface FieldWrapperProps {
  label: string;
  error?: string;
  caption?: string;
  /** Small tag next to the label (e.g. "αυτόματο") marking a value the app filled in, not the user. */
  badge?: string;
  children: ReactNode;
}

export function FieldWrapper({ label, error, caption, badge, children }: FieldWrapperProps) {
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label}>{label}</label>
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>
      {children}
      {caption && <div className={styles.caption}>{caption}</div>}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  caption?: string;
  badge?: string;
}

export function TextField({ label, error, caption, badge, className, ...rest }: TextFieldProps) {
  return (
    <FieldWrapper label={label} error={error} caption={caption} badge={badge}>
      <input className={`${styles.input} ${className ?? ''}`} {...rest} />
    </FieldWrapper>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function TextAreaField({ label, error, className, ...rest }: TextAreaFieldProps) {
  return (
    <FieldWrapper label={label} error={error}>
      <textarea className={`${styles.textarea} ${className ?? ''}`} {...rest} />
    </FieldWrapper>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

export function MoreToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={styles.more} onClick={onToggle}>
      {open ? '− Λιγότερα' : '+ Περισσότερα'}
    </button>
  );
}
