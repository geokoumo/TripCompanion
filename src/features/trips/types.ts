import { z } from 'zod';
import { SCHEMA_VERSION, TRAVELER_AVATAR_COLORS } from '../../config/constants';
import { nullableOptional } from '../../shared/lib/zodHelpers';
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
  exchangeRateToHome: nullableOptional(z.number().positive()),
});

export type Leg = z.infer<typeof LegSchema>;

export const ShareSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  includedTabs: z.array(z.enum(TRIP_TABS)).default([]),
  shareToken: nullableOptional(z.string()),
});

export type ShareSettings = z.infer<typeof ShareSettingsSchema>;

export const TripSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Ο τίτλος είναι υποχρεωτικός'),
  homeCurrency: z.string().min(1).default('EUR'),
  archived: z.boolean().default(false),
  // Optional free-text blurb, shown on Overview when present. Backed by the
  // `description` column added in the Round 9 migration.
  description: nullableOptional(z.string()),
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
  budget: nullableOptional(z.number().nonnegative()),
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

// The lightweight shape the Home/trip-list screen actually needs — everything
// list_trips() returns, and nothing that would require assembling a trip's
// full nested data just to render a card. Never construct one of these by
// hand from a partial Trip; always go through lib/tripListItem.ts.
export const TripListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  archived: z.boolean(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  cities: z.array(z.string()).default([]),
  travelers: z.array(z.object({ name: z.string(), avatarColor: z.enum(TRAVELER_AVATAR_COLORS) })).default([]),
});

export type TripListItem = z.infer<typeof TripListItemSchema>;

export type TripStatus = 'upcoming' | 'today' | 'ongoing' | 'completed';

export function getTripStatus(range: { startDate: string; endDate: string } | null, today: Date = new Date()): TripStatus {
  if (!range) return 'upcoming';
  const todayStr = today.toISOString().slice(0, 10);
  if (todayStr < range.startDate) return 'upcoming';
  if (todayStr > range.endDate) return 'completed';
  if (todayStr === range.startDate) return 'today';
  return 'ongoing';
}
