import { z } from 'zod';
import { FLIGHT_STATUSES } from '../../config/constants';

const statusIds = FLIGHT_STATUSES.map((s) => s.id) as [string, ...string[]];

export const FlightSchema = z.object({
  id: z.string(),
  legId: z.string().optional(),
  airline: z.string().min(1, 'Η αεροπορική εταιρεία είναι υποχρεωτική'),
  flightNumber: z.string().min(1, 'Ο αριθμός πτήσης είναι υποχρεωτικός'),
  depAirport: z.string().min(1, 'Το αεροδρόμιο αναχώρησης είναι υποχρεωτικό').toUpperCase(),
  depDate: z.string().min(1, 'Η ημερομηνία αναχώρησης είναι υποχρεωτική'),
  depTime: z.string().min(1, 'Η ώρα αναχώρησης είναι υποχρεωτική'),
  arrAirport: z.string().min(1, 'Το αεροδρόμιο άφιξης είναι υποχρεωτικό').toUpperCase(),
  arrDate: z.string().min(1, 'Η ημερομηνία άφιξης είναι υποχρεωτική'),
  arrTime: z.string().min(1, 'Η ώρα άφιξης είναι υποχρεωτική'),
  status: z.enum(statusIds).default('scheduled'),
  terminal: z.string().optional(),
  gate: z.string().optional(),
  bookingRef: z.string().optional(),
  link: z.string().optional(),
  /** Manual timezone override for unlisted airports, remembered per code. */
  depTimezoneOverride: z.string().optional(),
  arrTimezoneOverride: z.string().optional(),
});

export type Flight = z.infer<typeof FlightSchema>;
