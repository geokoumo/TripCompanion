import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import styles from './Field.module.css';

interface FieldWrapperProps {
  label: string;
  error?: string;
  caption?: string;
  children: ReactNode;
}

export function FieldWrapper({ label, error, caption, children }: FieldWrapperProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
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
}

export function TextField({ label, error, caption, className, ...rest }: TextFieldProps) {
  return (
    <FieldWrapper label={label} error={error} caption={caption}>
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
