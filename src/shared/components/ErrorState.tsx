import { Button } from './Button';
import styles from './ErrorState.module.css';

interface ErrorStateProps {
  headline: string;
  body: string;
  /** Omit when there's genuinely nothing the user can do but leave — never show a retry that doesn't retry anything. */
  onRetry?: () => void;
  retryLabel?: string;
}

/** A real, on-brand error surface — used for the app crash boundary and any screen-level "this failed to load" state. Never the raw unstyled fallback that would look like a different app mid-crash. */
export function ErrorState({ headline, body, onRetry, retryLabel = 'Try again' }: ErrorStateProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.icon} role="img" aria-label="Error">
        ⚠
      </div>
      <div className={styles.headline}>{headline}</div>
      <div className={styles.body}>{body}</div>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
