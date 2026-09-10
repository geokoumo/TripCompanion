import styles from './ScreenLoadingFallback.module.css';

/**
 * Suspense fallback for the lazy-loaded screens (wizard, documents, search,
 * settings, share). Unlike the "no skeleton loaders" rule elsewhere in the
 * app — which is about already-local data that never needs a fake loading
 * state — this is a real network fetch of a JS chunk the first time a
 * screen is opened, so a brief honest spinner is warranted here.
 */
export function ScreenLoadingFallback() {
  return (
    <div className={styles.overlay}>
      <div className={styles.spinner} />
    </div>
  );
}
