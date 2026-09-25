import { validateActivity, type DomainError, type Activity as DomainActivity } from '../../../domain';
import type { DateRange } from '../../../domain';
import { formatDateNoYear } from '../../../shared/lib/dateFormat';
import { getTripDateRange } from '../../trips/lib/dateRange';
import type { Flight } from '../../flights/types';
import type { Stay } from '../../stays/types';
import type { Trip } from '../../trips/types';
import type { ItineraryStop } from '../types';

/** Maps the app's persisted ItineraryStop onto the domain layer's Activity shape — see src/domain/schemas.ts for why the two are kept field-compatible rather than identical. */
export function toDomainActivity(stop: ItineraryStop): DomainActivity {
  return {
    id: stop.id,
    title: stop.title,
    type: stop.type,
    date: stop.date,
    allDay: stop.allDay,
    time: stop.time ?? undefined,
    durationMinutes: stop.durationMinutes ?? undefined,
    location: stop.location ?? undefined,
    price: stop.price ?? undefined,
    currency: stop.currency ?? undefined,
    notes: stop.note ?? undefined,
    link: stop.link ?? undefined,
    travelerIds: stop.travelerIds,
    done: stop.done,
  };
}

export function tripActivityRange(trip: Pick<Trip, 'legs' | 'flights' | 'stays'>): DateRange | null {
  return getTripDateRange(trip.legs, trip.flights, trip.stays);
}

/**
 * Full domain validation for one stop about to be saved — required fields,
 * date range, time/duration, price/currency, location, and overlap against
 * every other stop on `existingStops` (which should be the freshest known
 * itinerary; see callers for why that matters at save time). Editing is
 * handled automatically: a stop with the same id as `stop` in
 * `existingStops` never conflicts against itself.
 */
export function validateStopForSave(stop: ItineraryStop, trip: Pick<Trip, 'legs' | 'flights' | 'stays'>, existingStops: ItineraryStop[]): DomainError[] {
  return validateActivity(toDomainActivity(stop), {
    tripRange: tripActivityRange(trip),
    existingActivities: existingStops.map(toDomainActivity),
    // F-06: real flight/stay travel-window occupancy, checked here so every
    // caller of validateStopForSave (manual StopForm, idea assignment, and
    // booking→itinerary) gets it identically — never only the StopForm UI.
    flights: trip.flights,
    stays: trip.stays,
  });
}

const FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  type: 'Type',
  date: 'Date',
  time: 'Time',
  location: 'Location',
};

/**
 * Turns one machine-readable DomainError into a plain-language message —
 * this presentation layer is deliberately outside src/domain, which never
 * hardcodes copy. `flights`/`stays` are optional and only needed to name the
 * specific flight/stay a TIME_OVERLAP's conflictingKind points at (F-06);
 * omitting them still produces a correct, just less specific, message.
 */
export function describeActivityError(error: DomainError, stops: ItineraryStop[], flights: Flight[] = [], stays: Stay[] = []): string {
  switch (error.code) {
    case 'MISSING_REQUIRED_DATA':
      return `${FIELD_LABELS[error.field] ?? 'This field'} is required.`;
    case 'INVALID_DATE':
      return 'Enter a valid date.';
    case 'DATE_OUT_OF_RANGE':
      return `Choose a date between ${formatDateNoYear(error.rangeStart)} and ${formatDateNoYear(error.rangeEnd)} — outside your trip's dates.`;
    case 'INVALID_TIME_RANGE':
      return 'Enter a valid time.';
    case 'INVALID_DURATION':
      return 'Duration must be a positive number of minutes.';
    case 'TIME_OVERLAP': {
      if (error.conflictingKind === 'flight') {
        const flight = flights.find((f) => f.id === error.conflictingId);
        return flight
          ? `This overlaps with your ${flight.airline} ${flight.flightNumber} flight. Change the time or duration.`
          : 'This overlaps with one of your flights. Change the time or duration.';
      }
      if (error.conflictingKind === 'stay') {
        const stay = stays.find((s) => s.id === error.conflictingId);
        return stay
          ? `This falls on check-in/check-out for "${stay.name}". Change the time or duration.`
          : 'This falls on a stay\'s check-in/check-out. Change the time or duration.';
      }
      const conflict = stops.find((s) => s.id === error.conflictingId);
      return conflict
        ? `This overlaps with "${conflict.title}"${conflict.time ? ` at ${conflict.time}` : ''}. Change the time or duration.`
        : 'This time overlaps with another activity.';
    }
    case 'INVALID_PRICE':
      return 'Enter a valid price (0 or more).';
    case 'INVALID_CURRENCY':
      return 'Enter a 3-letter currency code (e.g. EUR).';
    case 'INVALID_LOCATION':
      return 'Location cannot be blank — clear it or fill it in.';
    default:
      return 'This activity could not be saved.';
  }
}
