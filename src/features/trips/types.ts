import { z } from 'zod';
import { SCHEMA_VERSION } from '../../config/constants';
import { TravelerSchema } from '../travelers/types';
import { FlightSchema } from '../flights/types';
import { StaySchema } from '../stays/types';
import { ItineraryStopSchema, IdeaSchema } from '../itinerary/types';
import { BudgetCategorySchema, ExpenseSchema } from '../budget/types';
import { ChecklistItemSchema } from '../checklist/types';

export const TRIP_TABS = ['overview', 'flights', 'stays', 'itinerary', 'budget', 'checklist'] as const;
export type TripTab = (typeof TRIP_TABS)[number];

export const LegSchema = z.object({
  id: z.string(),
  city: z.string(),
  country: z.string(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  currency: z.string().min(1),
  exchangeRateToHome: z.number().positive().optional(),
});

export type Leg = z.infer<typeof LegSchema>;

export const ShareSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  includedTabs: z.array(z.enum(TRIP_TABS)).default([]),
  shareToken: z.string().optional(),
});

export type ShareSettings = z.infer<typeof ShareSettingsSchema>;

export const TripSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Ο τίτλος είναι υποχρεωτικός'),
  homeCurrency: z.string().min(1).default('EUR'),
  archived: z.boolean().default(false),
  travelers: z.array(TravelerSchema).default([]),
  // The trip's overall date span is DERIVED from legs[]/flights[] — see lib/dateRange.ts.
  // Never stored directly.
  legs: z.array(LegSchema).default([]),
  flights: z.array(FlightSchema).default([]),
  stays: z.array(StaySchema).default([]),
  itineraryStops: z.array(ItineraryStopSchema).default([]),
  ideas: z.array(IdeaSchema).default([]),
  budgetCategories: z.array(BudgetCategorySchema).default([]),
  // Overall trip budget target, set by the user from the budget overview —
  // undefined means "not set yet", never a fabricated default.
  budget: z.number().nonnegative().optional(),
  // Per-trip remembered location strings (itinerary stop location, stay
  // address), most-recent-first, offered back as suggestion chips. Scoped to
  // this trip only — never shared across trips.
  rememberedLocations: z.array(z.string()).default([]),
  expenses: z.array(ExpenseSchema).default([]),
  checklistItems: z.array(ChecklistItemSchema).default([]),
  shareSettings: ShareSettingsSchema.default({ enabled: false, includedTabs: [] }),
  schemaVersion: z.number().default(SCHEMA_VERSION),
  createdAt: z.string(),
});

export type Trip = z.infer<typeof TripSchema>;

export type TripStatus = 'upcoming' | 'today' | 'ongoing' | 'completed';

export function getTripStatus(range: { startDate: string; endDate: string } | null, today: Date = new Date()): TripStatus {
  if (!range) return 'upcoming';
  const todayStr = today.toISOString().slice(0, 10);
  if (todayStr < range.startDate) return 'upcoming';
  if (todayStr > range.endDate) return 'completed';
  if (todayStr === range.startDate) return 'today';
  return 'ongoing';
}
