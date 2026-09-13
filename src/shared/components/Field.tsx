import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import styles from './Field.module.css';

interface FieldWrapperProps {
  label: string;
  error?: string;
  caption?: string;
  /** Small tag next to the label (e.g. "auto") marking a value the app filled in, not the user. */
  badge?: string;
  /** Links the label to a single real form control (TextField/TextAreaField pass this automatically). Omit when wrapping a group of controls (a chip picker, a custom button-based field) that has no single element to point at. */
  htmlFor?: string;
  /** Base id for this field's caption/error text (TextField/TextAreaField pass this automatically so their aria-describedby can point at whichever of the two actually renders). */
  descriptionId?: string;
  children: ReactNode;
}

export function FieldWrapper({ label, error, caption, badge, htmlFor, descriptionId, children }: FieldWrapperProps) {
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={htmlFor}>
          {label}
        </label>
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>
      {children}
      {caption && (
        <div className={styles.caption} id={descriptionId ? `${descriptionId}-caption` : undefined}>
          {caption}
        </div>
      )}
      {error && (
        <div className={styles.error} id={descriptionId ? `${descriptionId}-error` : undefined} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  caption?: string;
  badge?: string;
}

export function TextField({ label, error, caption, badge, className, id, ...rest }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = error || caption ? inputId : undefined;
  const describedBy = [error && `${inputId}-error`, caption && `${inputId}-caption`].filter(Boolean).join(' ') || undefined;

  return (
    <FieldWrapper label={label} error={error} caption={caption} badge={badge} htmlFor={inputId} descriptionId={descriptionId}>
      <input
        id={inputId}
        className={`${styles.input} ${className ?? ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
    </FieldWrapper>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  caption?: string;
}

export function TextAreaField({ label, error, caption, className, id, ...rest }: TextAreaFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = error || caption ? inputId : undefined;
  const describedBy = [error && `${inputId}-error`, caption && `${inputId}-caption`].filter(Boolean).join(' ') || undefined;

  return (
    <FieldWrapper label={label} error={error} caption={caption} htmlFor={inputId} descriptionId={descriptionId}>
      <textarea
        id={inputId}
        className={`${styles.textarea} ${className ?? ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
    </FieldWrapper>
  );
}

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

export function MoreToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={styles.more} onClick={onToggle} aria-expanded={open}>
      {open ? '− Less' : '+ More'}
    </button>
  );
}
