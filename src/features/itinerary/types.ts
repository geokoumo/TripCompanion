import { z } from 'zod';
import { ITINERARY_STOP_TYPES, type ItineraryStopTypeId } from '../../config/constants';
import { nullableOptional } from '../../shared/lib/zodHelpers';

const stopTypeIds = ITINERARY_STOP_TYPES.map((t) => t.id) as [ItineraryStopTypeId, ...ItineraryStopTypeId[]];

export const ItineraryStopSchema = z
  .object({
    id: z.string(),
    legId: nullableOptional(z.string()),
    date: z.string().min(1),
    // Required unless allDay — see superRefine below. An all-day stop has no
    // specific time slot, so it renders under the "ALL DAY" heading instead
    // (and the DB column is null for it — nullableOptional normalizes that
    // to undefined before this runs, same as every other field here).
    time: nullableOptional(z.string()),
    allDay: z.boolean().default(false),
    durationMinutes: nullableOptional(z.number().int().positive()),
    title: z.string().min(1, 'Title is required'),
    type: z.enum(stopTypeIds),
    location: nullableOptional(z.string()),
    price: nullableOptional(z.number().nonnegative()),
    currency: nullableOptional(z.string()),
    link: nullableOptional(z.string()),
    note: nullableOptional(z.string()),
    travelerIds: z.array(z.string()).default([]), // empty = all travelers
    // F-12: distinguishes "deliberately assigned to everyone" (the existing,
    // unchanged meaning of an empty travelerIds — the default for every stop
    // that predates this field, and for every stop a user saves normally)
    // from "was assigned to a specific traveler who has since been removed
    // from the trip" (set only by travelerRemoval.ts's cascade). Absent/false
    // means "everyone", exactly as travelerIds.length === 0 always has —
    // this field only ever narrows that case, never redefines it.
    assignedToNobody: nullableOptional(z.boolean()),
    done: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.allDay && !data.time) {
      ctx.addIssue({ code: 'custom', path: ['time'], message: 'Time is required unless it is all day' });
    }
  });

export type ItineraryStop = z.infer<typeof ItineraryStopSchema>;

export const IdeaSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  type: z.enum(stopTypeIds),
  location: nullableOptional(z.string()),
  link: nullableOptional(z.string()),
  note: nullableOptional(z.string()),
  suggestedDate: nullableOptional(z.string()),
});

export type Idea = z.infer<typeof IdeaSchema>;

/** A read-only entry auto-derived from a flight or stay, rendered on the timeline. */
export interface AutoPulledEntry {
  id: string;
  date: string;
  time: string;
  title: string;
  source: 'flight' | 'stay';
  kind: 'departure' | 'arrival' | 'checkin' | 'checkout';
  sourceId: string;
}
