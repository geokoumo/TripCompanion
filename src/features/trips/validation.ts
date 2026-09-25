import { z } from 'zod';
import type { Stay } from '../stays/types';
import { LegSchema, type Leg } from './types';

/** Generic date-order check reused across trips, legs, stays. Equal dates are valid. */
export function isEndOnOrAfterStart(startDate: string, endDate: string): boolean {
  return endDate >= startDate;
}

/**
 * Save-time guard shared by both repository backends and by trip import
 * (F-08): a leg whose end predates its start, or a stay whose checkout
 * predates its checkin, must never be persisted — mirroring the DB's own
 * CHECK constraints (legs.end_date >= start_date; stays' checkout >=
 * checkin) so LocalStorage rejects exactly what Supabase already does.
 *
 * Deliberately NOT folded into LegSchema/StaySchema themselves: those are
 * also used to parse an already-persisted trip on load, and a historical
 * trip must stay loadable even if it (or data imported into it) predates
 * this check — this only gates new writes, never blocks reading existing
 * data. LegFormSchema's own superRefine already keeps the normal UI from
 * creating this state in the first place; this is the backstop for paths
 * (a hand-edited/legacy import file) that don't go through that form.
 */
export function hasInvalidDateOrder(trip: { legs: Leg[]; stays: Stay[] }): boolean {
  const legInvalid = trip.legs.some((leg) => !isEndOnOrAfterStart(leg.startDate, leg.endDate));
  const stayInvalid = trip.stays.some(
    (stay) => !isEndOnOrAfterStart(`${stay.checkinDate}T${stay.checkinTime}`, `${stay.checkoutDate}T${stay.checkoutTime}`),
  );
  return legInvalid || stayInvalid;
}

// Wizard step 1 ("Basics") draft shape — these dates seed the trip's first leg;
// Trip itself never stores a top-level date range (it's derived from legs/flights).
export const TripFormSchema = z
  .object({
    title: z.string().min(1, 'A title is required'),
    startDate: z.string().min(1, 'A start date is required'),
    endDate: z.string().min(1, 'An end date is required'),
  })
  .superRefine((data, ctx) => {
    if (!isEndOnOrAfterStart(data.startDate, data.endDate)) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'The end date must be after the start date',
      });
    }
  });

export const LegFormSchema = LegSchema.superRefine((data, ctx) => {
  if (!isEndOnOrAfterStart(data.startDate, data.endDate)) {
    ctx.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'The end date must be after the start date',
    });
  }
});

export type TripFormValues = z.infer<typeof TripFormSchema>;
export type LegFormValues = z.infer<typeof LegFormSchema>;
