import { z } from 'zod';
import { ITINERARY_STOP_TYPES } from '../../config/constants';

const stopTypeIds = ITINERARY_STOP_TYPES.map((t) => t.id) as [string, ...string[]];

export const ItineraryStopSchema = z.object({
  id: z.string(),
  legId: z.string().optional(),
  date: z.string().min(1),
  time: z.string().min(1),
  durationMinutes: z.number().int().positive().optional(),
  title: z.string().min(1, 'Ο τίτλος είναι υποχρεωτικός'),
  type: z.enum(stopTypeIds),
  location: z.string().optional(),
  link: z.string().optional(),
  note: z.string().optional(),
  travelerIds: z.array(z.string()).default([]), // empty = all travelers
  done: z.boolean().default(false),
});

export type ItineraryStop = z.infer<typeof ItineraryStopSchema>;

export const IdeaSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Ο τίτλος είναι υποχρεωτικός'),
  type: z.enum(stopTypeIds),
  location: z.string().optional(),
  link: z.string().optional(),
  note: z.string().optional(),
  suggestedDate: z.string().optional(),
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
