import { validateTrip, type DomainError } from '../../../domain';
import { isMissingExchangeRate } from '../../budget/lib/currency';
import { formatDateNoYear, formatDateShort } from '../../../shared/lib/dateFormat';
import type { Trip } from '../../trips/types';
import { toDomainTrip } from './domainMapping';
import type { TripHealthCheckType, TripHealthPassedCheck, TripHealthReport, TripHealthWarning } from '../types';

/** How far ahead a flight has to be before a missing boarding pass is worth flagging — matches the real-world 24–48h check-in window, so a flight three weeks out doesn't get flagged for something nobody would have done yet. */
const BOARDING_PASS_WINDOW_DAYS = 2;

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(y!, m! - 1, d! + days);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}

function activityLabel(trip: Trip, id: string | undefined): string {
  return trip.itineraryStops.find((s) => s.id === id)?.title ?? 'This activity';
}

function stayLabel(trip: Trip, id: string | undefined): string {
  return trip.stays.find((s) => s.id === id)?.name ?? 'This stay';
}

const FIELD_LABELS: Record<string, string> = {
  title: 'title',
  type: 'type',
  date: 'date',
  time: 'time',
  location: 'location',
  startDate: 'start date',
  endDate: 'end date',
  travelers: 'at least one traveler',
};

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

/**
 * Removes the mirror-image duplicate that TIME_OVERLAP/STAY_OVERLAP always
 * produce (domain.validateTrip reports a conflict from BOTH entities'
 * perspectives, which is exactly right for per-entity save-time validation
 * but would show the same real-world conflict twice as separate Trip
 * Health cards) — keeps exactly one warning per unordered {entityId,
 * conflictingId} pair.
 */
function dedupePairwiseErrors(errors: DomainError[]): DomainError[] {
  const seen = new Set<string>();
  const result: DomainError[] = [];
  for (const error of errors) {
    if (error.code === 'TIME_OVERLAP' || error.code === 'STAY_OVERLAP') {
      const key = [error.entityId ?? '', error.conflictingId].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
    }
    result.push(error);
  }
  return result;
}

/**
 * Translates one DomainError from domain.validateTrip() into a Trip Health
 * warning. This is the ONLY place a machine-readable DomainErrorCode is
 * turned into a check type + copy keys — every check that domain already
 * covers (required trip fields, per-activity data validity, activity
 * conflicts, stay overlaps) is sourced from here, never re-derived.
 */
function mapDomainError(error: DomainError, trip: Trip): TripHealthWarning {
  const entityType = error.code === 'STAY_OVERLAP' ? 'stay' : error.entityId ? 'activity' : 'trip';
  const entityId = error.entityId ?? trip.id;

  switch (error.code) {
    case 'MISSING_REQUIRED_DATA':
      if (entityType === 'trip') {
        return {
          type: 'MISSING_REQUIRED_TRIP_INFO',
          severity: 'critical',
          entityType: 'trip',
          entityId,
          titleKey: 'tripHealth.title.missingTripInfo',
          descriptionKey: 'tripHealth.description.missingTripInfo',
          params: { field: fieldLabel(error.field) },
          action: 'tripHealth.action.completeTripInfo',
          navigationTarget: 'itinerary',
        };
      }
      return {
        type: 'MISSING_REQUIRED_ACTIVITY_INFO',
        severity: 'warning',
        entityType: 'activity',
        entityId,
        titleKey: 'tripHealth.title.missingActivityInfo',
        descriptionKey: 'tripHealth.description.missingActivityInfo',
        params: { activity: activityLabel(trip, entityId), field: fieldLabel(error.field) },
        action: 'tripHealth.action.reviewItinerary',
        navigationTarget: 'itinerary',
      };

    case 'INVALID_DATE':
      return {
        type: 'ACTIVITY_DATE_OUT_OF_RANGE',
        severity: 'warning',
        entityType: 'activity',
        entityId,
        titleKey: 'tripHealth.title.activityDateOutOfRange',
        descriptionKey: 'tripHealth.description.activityInvalidDateValue',
        params: { activity: activityLabel(trip, entityId) },
        action: 'tripHealth.action.reviewItinerary',
        navigationTarget: 'itinerary',
      };

    case 'DATE_OUT_OF_RANGE':
      return {
        type: 'ACTIVITY_DATE_OUT_OF_RANGE',
        severity: 'warning',
        entityType: 'activity',
        entityId,
        titleKey: 'tripHealth.title.activityDateOutOfRange',
        descriptionKey: 'tripHealth.description.activityDateOutOfRange',
        params: {
          activity: activityLabel(trip, entityId),
          date: formatDateNoYear(error.date),
          rangeStart: formatDateNoYear(error.rangeStart),
          rangeEnd: formatDateNoYear(error.rangeEnd),
        },
        action: 'tripHealth.action.reviewItinerary',
        navigationTarget: 'itinerary',
      };

    case 'INVALID_TIME_RANGE':
      return {
        type: 'ACTIVITY_INVALID_TIME',
        severity: 'warning',
        entityType: 'activity',
        entityId,
        titleKey: 'tripHealth.title.activityInvalidTime',
        descriptionKey: 'tripHealth.description.activityInvalidTime',
        params: { activity: activityLabel(trip, entityId) },
        action: 'tripHealth.action.reviewItinerary',
        navigationTarget: 'itinerary',
      };

    case 'INVALID_DURATION':
      return {
        type: 'ACTIVITY_INVALID_DURATION',
        severity: 'warning',
        entityType: 'activity',
        entityId,
        titleKey: 'tripHealth.title.activityInvalidDuration',
        descriptionKey: 'tripHealth.description.activityInvalidDuration',
        params: { activity: activityLabel(trip, entityId) },
        action: 'tripHealth.action.reviewItinerary',
        navigationTarget: 'itinerary',
      };

    case 'INVALID_PRICE':
    case 'INVALID_CURRENCY':
      return {
        type: 'ACTIVITY_INVALID_PRICE',
        severity: 'warning',
        entityType: 'activity',
        entityId,
        titleKey: 'tripHealth.title.activityInvalidPrice',
        descriptionKey: 'tripHealth.description.activityInvalidPrice',
        params: { activity: activityLabel(trip, entityId) },
        action: 'tripHealth.action.reviewItinerary',
        navigationTarget: 'itinerary',
      };

    case 'INVALID_LOCATION':
      return {
        type: 'ACTIVITY_INVALID_LOCATION',
        severity: 'warning',
        entityType: 'activity',
        entityId,
        titleKey: 'tripHealth.title.activityInvalidLocation',
        descriptionKey: 'tripHealth.description.activityInvalidLocation',
        params: { activity: activityLabel(trip, entityId) },
        action: 'tripHealth.action.reviewItinerary',
        navigationTarget: 'itinerary',
      };

    case 'TIME_OVERLAP':
      return {
        type: 'ACTIVITY_CONFLICT',
        severity: 'warning',
        entityType: 'activity',
        entityId,
        titleKey: 'tripHealth.title.activityConflict',
        descriptionKey: 'tripHealth.description.activityConflict',
        params: {
          activity: activityLabel(trip, entityId),
          conflicting: activityLabel(trip, error.conflictingId),
          date: formatDateNoYear(trip.itineraryStops.find((s) => s.id === entityId)?.date ?? ''),
        },
        action: 'tripHealth.action.reviewItinerary',
        navigationTarget: 'itinerary',
      };

    case 'STAY_OVERLAP': {
      const stayA = trip.stays.find((s) => s.id === entityId);
      const stayB = trip.stays.find((s) => s.id === error.conflictingId);
      // The later of the two check-ins is the day the overlap actually starts.
      const overlapDate = stayA && stayB ? (stayB.checkinDate >= stayA.checkinDate ? stayB.checkinDate : stayA.checkinDate) : '';
      return {
        type: 'STAY_OVERLAP',
        severity: 'warning',
        entityType: 'stay',
        entityId,
        titleKey: 'tripHealth.title.stayOverlap',
        descriptionKey: 'tripHealth.description.stayOverlap',
        params: {
          stay: stayLabel(trip, entityId),
          conflicting: stayLabel(trip, error.conflictingId),
          date: overlapDate ? formatDateNoYear(overlapDate) : '',
        },
        action: 'tripHealth.action.updateStayDates',
        navigationTarget: 'stays',
      };
    }
  }
}

/** Flights departing imminently with no matching boarding-pass document attached. Not covered by the domain layer (which knows nothing about documents) — a Trip-Health-specific policy check. */
function checkBoardingPasses(trip: Trip, today: string): TripHealthWarning[] {
  const windowEnd = addDays(today, BOARDING_PASS_WINDOW_DAYS);
  const warnings: TripHealthWarning[] = [];
  for (const flight of trip.flights) {
    if (flight.status === 'cancelled') continue;
    if (flight.depDate < today || flight.depDate > windowEnd) continue;
    const relatedTo = flight.depAirport && flight.arrAirport ? `${flight.depAirport} → ${flight.arrAirport} flight` : 'Flight';
    const hasBoardingPass = trip.documents.some((d) => d.category === 'boarding_pass' && d.relatedTo === relatedTo);
    if (hasBoardingPass) continue;
    warnings.push({
      type: 'MISSING_BOARDING_PASS',
      severity: 'warning',
      entityType: 'flight',
      entityId: flight.id,
      titleKey: 'tripHealth.title.missingBoardingPass',
      descriptionKey: 'tripHealth.description.missingBoardingPass',
      params: { flight: `${flight.airline} ${flight.flightNumber}`, date: formatDateShort(flight.depDate) },
      action: 'tripHealth.action.uploadBoardingPass',
      navigationTarget: 'flights',
    });
  }
  return warnings;
}

/** Stays with no hotel-confirmation document attached — matched the same way StayForm's own Attachments field tags one (relatedTo = the stay's name). Not time-windowed like boarding passes: unlike a boarding pass, a confirmation is normally available the moment the stay is booked. */
function checkStayDocuments(trip: Trip): TripHealthWarning[] {
  const warnings: TripHealthWarning[] = [];
  for (const stay of trip.stays) {
    const hasConfirmation = trip.documents.some((d) => d.category === 'hotel_confirmation' && d.relatedTo === stay.name);
    if (hasConfirmation) continue;
    warnings.push({
      type: 'MISSING_STAY_DOCUMENT',
      severity: 'warning',
      entityType: 'stay',
      entityId: stay.id,
      titleKey: 'tripHealth.title.missingStayDocument',
      descriptionKey: 'tripHealth.description.missingStayDocument',
      params: { stay: stay.name },
      action: 'tripHealth.action.addDocument',
      navigationTarget: 'stays',
    });
  }
  return warnings;
}

/** Foreign-currency expenses with no saved conversion rate, grouped by currency — reuses budget's own isMissingExchangeRate rather than re-deriving the same condition. */
function checkExchangeRates(trip: Trip): TripHealthWarning[] {
  const missingByCurrency = new Map<string, number>();
  for (const expense of trip.expenses) {
    if (isMissingExchangeRate(expense, trip.homeCurrency)) {
      missingByCurrency.set(expense.currency, (missingByCurrency.get(expense.currency) ?? 0) + 1);
    }
  }
  const warnings: TripHealthWarning[] = [];
  for (const [currency, count] of missingByCurrency) {
    warnings.push({
      type: 'MISSING_EXCHANGE_RATE',
      severity: 'warning',
      entityType: 'trip',
      entityId: trip.id,
      titleKey: 'tripHealth.title.missingExchangeRate',
      descriptionKey: 'tripHealth.description.missingExchangeRate',
      params: { count: String(count), currency, expenseWord: count === 1 ? 'expense is' : 'expenses are' },
      action: 'tripHealth.action.addExchangeRate',
      navigationTarget: 'budget',
    });
  }
  return warnings;
}

const CATEGORY_BY_TYPE: Record<TripHealthCheckType, string> = {
  MISSING_REQUIRED_TRIP_INFO: 'tripInfo',
  MISSING_REQUIRED_ACTIVITY_INFO: 'activityIntegrity',
  ACTIVITY_DATE_OUT_OF_RANGE: 'activityIntegrity',
  ACTIVITY_INVALID_TIME: 'activityIntegrity',
  ACTIVITY_INVALID_DURATION: 'activityIntegrity',
  ACTIVITY_INVALID_PRICE: 'activityIntegrity',
  ACTIVITY_INVALID_LOCATION: 'activityIntegrity',
  ACTIVITY_CONFLICT: 'activityConflicts',
  STAY_OVERLAP: 'stayOverlaps',
  MISSING_BOARDING_PASS: 'boardingPasses',
  MISSING_STAY_DOCUMENT: 'stayDocuments',
  MISSING_EXCHANGE_RATE: 'exchangeRates',
};

const PASSED_LABEL_BY_CATEGORY: Record<string, string> = {
  tripInfo: 'tripHealth.passed.tripInfo',
  activityIntegrity: 'tripHealth.passed.activityIntegrity',
  activityConflicts: 'tripHealth.passed.activityConflicts',
  stayOverlaps: 'tripHealth.passed.stayOverlaps',
  boardingPasses: 'tripHealth.passed.boardingPasses',
  stayDocuments: 'tripHealth.passed.stayDocuments',
  exchangeRates: 'tripHealth.passed.exchangeRates',
};

/**
 * Trip Health is entirely derived from saved trip data — every warning maps
 * to a real, checkable condition and every fix points at a screen that can
 * actually resolve it. Nothing here is hardcoded or simulated: the
 * required-info/activity-integrity/activity-conflict/stay-overlap checks
 * all come straight from domain.validateTrip() (the same engine Add/Edit
 * Activity uses to validate a save), and the remaining checks
 * (boarding passes, stay documents, exchange rates) are genuine
 * Trip-Health-only policies with nothing elsewhere to duplicate.
 *
 * Purely a function of `trip` and `today` — call it again after any change
 * to the trip (a new expense, a fixed stay date, an uploaded document) and
 * the report reflects exactly that change, with nothing cached in between.
 */
export function computeTripHealth(trip: Trip, today: string): TripHealthReport {
  const domainErrors = dedupePairwiseErrors(validateTrip(toDomainTrip(trip)));
  const warnings: TripHealthWarning[] = [
    ...domainErrors.map((error) => mapDomainError(error, trip)),
    ...checkBoardingPasses(trip, today),
    ...checkStayDocuments(trip),
    ...checkExchangeRates(trip),
  ];

  const warningCategories = new Set(warnings.map((w) => CATEGORY_BY_TYPE[w.type]));
  const passedChecks: TripHealthPassedCheck[] = Object.entries(PASSED_LABEL_BY_CATEGORY)
    .filter(([category]) => !warningCategories.has(category))
    .map(([id, labelKey]) => ({ id, labelKey }));

  return { warnings, passedChecks };
}
