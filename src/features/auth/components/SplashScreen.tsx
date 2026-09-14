import { Button } from '../../../shared/components/Button';
import styles from './SplashScreen.module.css';

interface SplashScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const PILLARS = [
  { number: '01', title: 'Plan', body: 'Plan dates and itinerary' },
  { number: '02', title: 'Organize', body: 'Organize bookings and budget' },
  { number: '03', title: 'Store', body: 'Store documents and packing' },
  { number: '04', title: 'Share', body: 'Share a read-only trip link' },
];

/** First screen a signed-out visitor sees — a plain, text-led pitch (no illustration), matching the approved warm-light V1 spec. */
export function SplashScreen({ onGetStarted, onSignIn }: SplashScreenProps) {
  return (
    <div className={styles.screen}>
      <h1 className={styles.wordmark}>TripCompanion</h1>
      <p className={styles.tagline}>Everything for your trip, organized in one elegant place. No clutter, just the essentials.</p>

      <div className={styles.pillars}>
        {PILLARS.map(({ number, title, body }) => (
          <div key={number} className={styles.pillar}>
            <span className={styles.pillarNumber}>{number}</span>
            <div>
              <div className={styles.pillarTitle}>{title.toUpperCase()}</div>
              <div className={styles.pillarBody}>{body}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <Button variant="primary" onClick={onGetStarted} style={{ flex: 'none', width: '100%' }}>
          Get started
        </Button>
        <Button variant="secondary" onClick={onSignIn} style={{ flex: 'none', width: '100%' }}>
          Sign in
        </Button>
      </div>
    </div>
  );
}
