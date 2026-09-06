import { z } from 'zod';
import { FLIGHT_STATUSES } from '../../config/constants';
import { nullableOptional } from '../../shared/lib/zodHelpers';

const statusIds = FLIGHT_STATUSES.map((s) => s.id) as [string, ...string[]];

export const FlightSchema = z.object({
  id: z.string(),
  legId: nullableOptional(z.string()),
  airline: z.string().min(1, 'Airline is required'),
  flightNumber: z.string().min(1, 'Flight number is required'),
  depAirport: z.string().min(1, 'Departure airport is required').toUpperCase(),
  depDate: z.string().min(1, 'Departure date is required'),
  depTime: z.string().min(1, 'Departure time is required'),
  arrAirport: z.string().min(1, 'Arrival airport is required').toUpperCase(),
  arrDate: z.string().min(1, 'Arrival date is required'),
  arrTime: z.string().min(1, 'Arrival time is required'),
  status: z.enum(statusIds).default('scheduled'),
  terminal: nullableOptional(z.string()),
  gate: nullableOptional(z.string()),
  bookingRef: nullableOptional(z.string()),
  link: nullableOptional(z.string()),
  /** Manual timezone override for unlisted airports, remembered per code. */
  depTimezoneOverride: nullableOptional(z.string()),
  arrTimezoneOverride: nullableOptional(z.string()),
});

export type Flight = z.infer<typeof FlightSchema>;
