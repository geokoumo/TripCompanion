/** Shown while the initial auth session is still resolving, so the app never flashes a signed-out state (or stale local data) before the real session is known. */
export function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
      Φόρτωση…
    </div>
  );
}
