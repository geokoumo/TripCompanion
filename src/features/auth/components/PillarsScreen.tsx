import { Button } from '../../../shared/components/Button';
import { CompassIcon, FileIcon, PeopleIcon, PinIcon } from '../../../shared/components/icons';
import styles from './PillarsScreen.module.css';

interface PillarsScreenProps {
  onBack: () => void;
  onGetStarted: () => void;
}

const PILLARS = [
  { Icon: PinIcon, title: 'Plan', body: 'Destinations, dates, and routes' },
  { Icon: CompassIcon, title: 'Organize', body: 'Flights, stays, tickets, and documents' },
  { Icon: FileIcon, title: 'Store', body: 'Boarding passes, QR codes, and reservations' },
  { Icon: PeopleIcon, title: 'Share', body: 'Collaborate with fellow travelers' },
];

/** The second onboarding screen — precedes sign-up/sign-in, replacing the old single Welcome screen together with SplashScreen. */
export function PillarsScreen({ onBack, onGetStarted }: PillarsScreenProps) {
  return (
    <div className={styles.screen}>
      <button type="button" className={styles.backLink} onClick={onBack} aria-label="Back">
        ‹
      </button>

      <div className={styles.iconBadge}>
        <CompassIcon size={40} />
      </div>
      <h1 className={styles.title}>Welcome to TripCompanion</h1>

      <div className={styles.pillars}>
        {PILLARS.map(({ Icon, title, body }) => (
          <div key={title} className={styles.pillar}>
            <div className={styles.pillarIcon}>
              <Icon size={20} />
            </div>
            <div>
              <div className={styles.pillarTitle}>{title}</div>
              <div className={styles.pillarBody}>{body}</div>
            </div>
          </div>
        ))}
      </div>

      <Button variant="primary" onClick={onGetStarted} style={{ flex: 'none', width: '100%', marginTop: 'var(--space-5)' }}>
        Get started
      </Button>
    </div>
  );
}
