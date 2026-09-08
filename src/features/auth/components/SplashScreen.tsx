import { Button } from '../../../shared/components/Button';
import styles from './SplashScreen.module.css';

interface SplashScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

/**
 * First screen a signed-out visitor sees. The mockup uses a real destination
 * photo here — this project has no image asset pipeline, so the hero is a
 * decorative gradient + skyline silhouette instead of a fabricated/downloaded
 * photo, keeping the same full-bleed hero-then-tagline structure.
 */
export function SplashScreen({ onGetStarted, onSignIn }: SplashScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.hero}>
        <svg className={styles.heroDecoration} viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" fill="none">
          <path d="M0 220 L60 150 L110 200 L170 110 L230 190 L280 140 L340 210 L400 170 L400 300 L0 300 Z" fill="#0d2521" />
          <path d="M0 250 L80 200 L150 240 L220 180 L300 230 L400 200 L400 300 L0 300 Z" fill="#0a1c19" opacity="0.8" />
          <circle cx="320" cy="60" r="34" fill="#f2ede4" opacity="0.9" />
        </svg>
        <div className={styles.wordmark}>TripCompanion</div>
      </div>

      <div className={styles.content}>
        <p className={styles.tagline}>Everything for your trip, in one place.</p>
        <div className={styles.actions}>
          <Button variant="primary" onClick={onGetStarted} style={{ flex: 'none', width: '100%' }}>
            Plan a trip
          </Button>
          <Button variant="ghost" onClick={onSignIn} style={{ flex: 'none', width: '100%' }}>
            I already have an account
          </Button>
        </div>
      </div>
    </div>
  );
}
