import { ListIcon, PlaneIcon, SparkleIcon, TargetIcon, TriangleIcon } from '../../../shared/components/icons';
import styles from './WelcomeScreen.module.css';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const FEATURES = [
  { Icon: ListIcon, label: 'Plan' },
  { Icon: TargetIcon, label: 'Log' },
  { Icon: SparkleIcon, label: 'Enjoy' },
];

/** First screen a signed-out visitor sees — before choosing to sign up, sign in, or continue without an account. */
export function WelcomeScreen({ onGetStarted, onSignIn }: WelcomeScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.top}>
        <div className={styles.logo}>
          <TriangleIcon size={26} />
        </div>
        <div className={styles.wordmark}>
          TRIP
          <br />
          COMPANION
        </div>
        <div className={styles.divider} />
        <p className={styles.tagline}>Your own travel journal.</p>
        <div className={styles.badge}>
          <span className={styles.badgeLabel}>ADVENTURE</span>
          <PlaneIcon size={20} />
          <span className={styles.badgeLabel}>AWAITS</span>
        </div>
        <p className={styles.disclaimer}>NO AI · NO LIVE APIS</p>
      </div>

      <div className={styles.features}>
        {FEATURES.map(({ Icon, label }) => (
          <div key={label} className={styles.feature}>
            <div className={styles.featureIcon}>
              <Icon size={22} />
            </div>
            <span className={styles.featureLabel}>{label}</span>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.primaryButton} onClick={onGetStarted}>
          Get started
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onSignIn}>
          I already have an account
        </button>
      </div>
    </div>
  );
}
