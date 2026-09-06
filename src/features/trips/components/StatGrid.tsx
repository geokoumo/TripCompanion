import { BedIcon, CalendarIcon, PeopleIcon, PlaneIcon } from '../../../shared/components/icons';
import { daysBetween } from '../../../shared/lib/dateFormat';
import { getTripDateRange } from '../lib/dateRange';
import type { Trip } from '../types';
import styles from './StatGrid.module.css';

/** Computed entirely from data already loaded for the trip — no new query. */
export function StatGrid({ trip }: { trip: Trip }) {
  const range = getTripDateRange(trip.legs, trip.flights);
  const days = range ? daysBetween(range.startDate, range.endDate) + 1 : 0;

  const stats = [
    { Icon: PlaneIcon, value: trip.flights.length, label: 'Flights' },
    { Icon: BedIcon, value: trip.stays.length, label: 'Stays' },
    { Icon: CalendarIcon, value: days, label: 'Days' },
    { Icon: PeopleIcon, value: trip.travelers.length, label: 'Travelers' },
  ];

  return (
    <div className={styles.grid}>
      {stats.map(({ Icon, value, label }) => (
        <div key={label} className={styles.tile}>
          <Icon size={18} />
          <div className={styles.value}>{value}</div>
          <div className={styles.label}>{label}</div>
        </div>
      ))}
    </div>
  );
}
