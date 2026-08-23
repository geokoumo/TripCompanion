import styles from './EmptyState.module.css';

export function EmptyState({ headline, body }: { headline: string; body: string }) {
  return (
    <div className={styles.panel}>
      <div className={styles.circle} />
      <div className={styles.headline}>{headline}</div>
      <div className={styles.body}>{body}</div>
    </div>
  );
}
