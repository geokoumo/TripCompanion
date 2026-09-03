import { useEffect, useRef, useState } from 'react';
import { useTripsContext } from '../../../app/providers/TripsProvider';
import { EmptyState } from '../../../shared/components/EmptyState';
import { BedIcon, CalendarIcon, PlaneIcon, SearchIcon, WalletIcon } from '../../../shared/components/icons';
import type { TripTab } from '../../trips/types';
import type { SearchMatchType, SearchResultGroup } from '../types';
import styles from './SearchScreen.module.css';

const MATCH_ICON: Record<SearchMatchType, typeof PlaneIcon> = {
  flight: PlaneIcon,
  stay: BedIcon,
  stop: CalendarIcon,
  expense: WalletIcon,
};

interface SearchScreenProps {
  onOpenTrip: (tripId: string, tab: TripTab) => void;
}

/** Across the signed-in user's own previously-entered trip data only — never destination discovery, nothing to browse. */
export function SearchScreen({ onOpenTrip }: SearchScreenProps) {
  const { searchTrips } = useTripsContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultGroup[] | null>(null);
  const [loading, setLoading] = useState(false);
  const latestRequest = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      return;
    }
    const requestId = ++latestRequest.current;
    setLoading(true);
    const timer = setTimeout(() => {
      void searchTrips(trimmed).then((groups) => {
        if (latestRequest.current !== requestId) return;
        setResults(groups);
        setLoading(false);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchTrips]);

  const trimmedQuery = query.trim();

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Αναζήτηση</h1>
      <div className={styles.inputWrap}>
        <SearchIcon size={18} className={styles.inputIcon} />
        <input
          className={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Αριθμός πτήσης, κατάλυμα, στάση, σημείωση εξόδου…"
          autoFocus
        />
      </div>

      {!trimmedQuery && (
        <EmptyState
          headline="Βρες κάτι δικό σου"
          body="Αναζήτησε πτήσεις, καταλύματα, στάσεις προγράμματος και σημειώσεις εξόδων στα ταξίδια σου."
        />
      )}

      {trimmedQuery && !loading && results && results.length === 0 && (
        <EmptyState headline="Κανένα αποτέλεσμα" body={`Δεν βρέθηκε τίποτα για «${trimmedQuery}».`} />
      )}

      {results &&
        results.map((group) => (
          <div key={group.tripId} className={styles.group}>
            <div className={styles.groupTitle}>{group.tripTitle}</div>
            {group.matches.map((match) => {
              const Icon = MATCH_ICON[match.type];
              return (
                <button
                  key={`${match.type}-${match.id}`}
                  type="button"
                  className={styles.resultRow}
                  onClick={() => onOpenTrip(group.tripId, match.tab)}
                >
                  <Icon size={18} />
                  <span>{match.label}</span>
                </button>
              );
            })}
          </div>
        ))}
    </div>
  );
}
