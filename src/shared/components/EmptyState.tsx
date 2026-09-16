import styles from './EmptyState.module.css';

interface EmptyStateProps {
  headline: string;
  body: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ headline, body, action }: EmptyStateProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.circle} />
      <div className={styles.headline}>{headline}</div>
      <div className={styles.body}>{body}</div>
      {action && (
        <button type="button" className={styles.action} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
