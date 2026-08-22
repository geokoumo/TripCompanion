import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  return <button type="button" className={`${styles.button} ${className ?? ''}`} data-variant={variant} {...rest} />;
}

export function Fab(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={styles.fab} aria-label="Νέο ταξίδι" {...props}>
      +
    </button>
  );
}
