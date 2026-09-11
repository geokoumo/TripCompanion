import { computeOccupiedRanges, findConflict } from '../../itinerary/lib/occupiedRanges';
import { dateTimeRangesOverlap } from '../../stays/lib/overlap';
import { formatDateShort } from '../../../shared/lib/dateFormat';
import type { Trip } from '../../trips/types';
import type { Stay } from '../../stays/types';
import type { TripHealthPassedCheck, TripHealthReport, TripHealthWarning } from '../types';

/** How far ahead a flight has to be before a missing boarding pass is worth flagging — matches the real-world 24–48h check-in window, so a flight three weeks out doesn't get flagged for something nobody would have done yet. */
const BOARDING_PASS_WINDOW_DAYS = 2;

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(y!, m! - 1, d! + days);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}

function stayRange(stay: Stay) {
  return {
    start: { date: stay.checkinDate, time: stay.checkinTime },
    end: { date: stay.checkoutDate, time: stay.checkoutTime },
  };
}

function checkExchangeRates(trip: Trip, warnings: TripHealthWarning[], passedChecks: TripHealthPassedCheck[]) {
  const missingByCurrency = new Map<string, number>();
  for (const expense of trip.expenses) {
    if (expense.currency !== trip.homeCurrency && expense.exchangeRateToHome == null) {
      missingByCurrency.set(expense.currency, (missingByCurrency.get(expense.currency) ?? 0) + 1);
    }
  }
  if (missingByCurrency.size === 0) {
    passedChecks.push({ id: 'exchange-rates', label: 'All foreign-currency expenses have a saved exchange rate.' });
    return;
  }
  for (const [currency, count] of missingByCurrency) {
    warnings.push({
      id: `exchange-rate-${currency}`,
      severity: 'warning',
      title: `Missing exchange rate ${currency} to ${trip.homeCurrency}`,
      description: `${count} ${currency} expense${count === 1 ? '' : 's'} ${count === 1 ? 'is' : 'are'} missing a saved exchange rate. Add a fixed rate so budget totals are calculated from saved trip data only.`,
      fixLabel: 'Add Exchange Rate',
      fixTarget: 'budget',
    });
  }
}

function checkBoardingPasses(trip: Trip, today: string, warnings: TripHealthWarning[], passedChecks: TripHealthPassedCheck[]) {
  const windowEnd = addDays(today, BOARDING_PASS_WINDOW_DAYS);
  let flagged = 0;
  for (const flight of trip.flights) {
    if (flight.status === 'cancelled') continue;
    if (flight.depDate < today || flight.depDate > windowEnd) continue;
    const relatedTo = flight.depAirport && flight.arrAirport ? `${flight.depAirport} → ${flight.arrAirport} flight` : 'Flight';
    const hasBoardingPass = trip.documents.some((d) => d.category === 'boarding_pass' && d.relatedTo === relatedTo);
    if (hasBoardingPass) continue;
    flagged += 1;
    warnings.push({
      id: `boarding-pass-${flight.id}`,
      severity: 'warning',
      title: `Missing boarding pass for ${flight.airline} ${flight.flightNumber}`,
      description: `This flight departs ${formatDateShort(flight.depDate)}, but no boarding pass is attached to the saved trip. Upload the PDF to complete the document set.`,
      fixLabel: 'Upload Boarding Pass',
      fixTarget: 'flights',
    });
  }
  if (flagged === 0) {
    passedChecks.push({ id: 'boarding-passes', label: 'Boarding passes are attached for flights departing soon.' });
  }
}

function checkStayOverlaps(trip: Trip, warnings: TripHealthWarning[], passedChecks: TripHealthPassedCheck[]) {
  const sorted = [...trip.stays].sort((a, b) => (a.checkinDate + a.checkinTime).localeCompare(b.checkinDate + b.checkinTime));
  let overlapCount = 0;
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i]!;
      const b = sorted[j]!;
      if (!dateTimeRangesOverlap(stayRange(a), stayRange(b))) continue;
      overlapCount += 1;
      warnings.push({
        id: `stay-overlap-${a.id}-${b.id}`,
        severity: 'warning',
        title: `Overlapping stays: ${a.name} & ${b.name}`,
        description: 'Saved check-out and check-in times overlap. Update one stay to prevent duplicate hotel coverage in the itinerary.',
        fixLabel: 'Update Stay Dates',
        fixTarget: 'stays',
      });
    }
  }
  if (overlapCount === 0) {
    passedChecks.push({ id: 'stay-overlaps', label: 'No overlapping stays.' });
  }
}

/**
 * Audits already-saved itinerary stops for time conflicts. StopForm blocks
 * creating a new conflict at save time, but this re-checks the saved data
 * itself (an edit that changed a duration, an imported trip, etc. could
 * still leave two stops overlapping) rather than trusting that the
 * write-time guard was always in effect.
 */
function checkItineraryConflicts(trip: Trip, warnings: TripHealthWarning[], passedChecks: TripHealthPassedCheck[]) {
  const timedStops = trip.itineraryStops.filter((s) => !s.allDay && s.time && s.durationMinutes);
  let hasConflict = false;
  for (const stop of timedStops) {
    const ranges = computeOccupiedRanges({ date: stop.date, stops: trip.itineraryStops, flights: [], stays: [], excludeStopId: stop.id });
    if (findConflict(toMinutes(stop.time!), stop.durationMinutes!, ranges)) {
      hasConflict = true;
      break;
    }
  }
  if (!hasConflict) {
    passedChecks.push({ id: 'itinerary-conflicts', label: 'No timed manual activity conflicts.' });
    return;
  }
  warnings.push({
    id: 'itinerary-conflicts',
    severity: 'warning',
    title: 'Overlapping itinerary stops',
    description: 'Two or more timed stops on the same day overlap. Adjust their times or durations so the schedule stays realistic.',
    fixLabel: 'Review Itinerary',
    fixTarget: 'itinerary',
  });
}

/**
 * Trip Health is entirely derived from saved trip data — every warning maps
 * to a real, checkable condition and every fix points at a screen that can
 * actually resolve it. Nothing here is hardcoded or simulated.
 */
export function computeTripHealth(trip: Trip, today: string): TripHealthReport {
  const warnings: TripHealthWarning[] = [];
  const passedChecks: TripHealthPassedCheck[] = [];

  checkExchangeRates(trip, warnings, passedChecks);
  checkBoardingPasses(trip, today, warnings, passedChecks);
  checkStayOverlaps(trip, warnings, passedChecks);
  checkItineraryConflicts(trip, warnings, passedChecks);

  if (trip.travelers.length > 0 && trip.legs.length > 0) {
    passedChecks.push({ id: 'required-info', label: 'Required trip information is complete: traveler, destination, and travel dates.' });
  }

  return { warnings, passedChecks };
}
