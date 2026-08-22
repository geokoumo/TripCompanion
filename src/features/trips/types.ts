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
  city: z.string().min(1, 'Η πόλη είναι υποχρεωτική'),
  country: z.string().min(1, 'Η χώρα είναι υποχρεωτική'),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  currency: z.string().min(1),
  exchangeRateToHome: z.number().positive().optional(),
});

export type Leg = z.infer<typeof LegSchema>;

export const ShareSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  includedTabs: z.array(z.enum(TRIP_TABS)).default([]),
});

export type ShareSettings = z.infer<typeof ShareSettingsSchema>;

export const TripSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Ο τίτλος είναι υποχρεωτικός'),
  startDate: z.string().min(1, 'Η ημερομηνία έναρξης είναι υποχρεωτική'),
  endDate: z.string().min(1, 'Η ημερομηνία λήξης είναι υποχρεωτική'),
  homeCurrency: z.string().min(1).default('EUR'),
  archived: z.boolean().default(false),
  travelers: z.array(TravelerSchema).default([]),
  legs: z.array(LegSchema).default([]),
  flights: z.array(FlightSchema).default([]),
  stays: z.array(StaySchema).default([]),
  itineraryStops: z.array(ItineraryStopSchema).default([]),
  ideas: z.array(IdeaSchema).default([]),
  budgetCategories: z.array(BudgetCategorySchema).default([]),
  expenses: z.array(ExpenseSchema).default([]),
  checklistItems: z.array(ChecklistItemSchema).default([]),
  shareSettings: ShareSettingsSchema.default({ enabled: false, includedTabs: [] }),
  schemaVersion: z.number().default(SCHEMA_VERSION),
  createdAt: z.string(),
});

export type Trip = z.infer<typeof TripSchema>;

export type TripStatus = 'upcoming' | 'ongoing' | 'completed';

export function getTripStatus(trip: Pick<Trip, 'startDate' | 'endDate'>, today: Date = new Date()): TripStatus {
  const todayStr = today.toISOString().slice(0, 10);
  if (todayStr < trip.startDate) return 'upcoming';
  if (todayStr > trip.endDate) return 'completed';
  return 'ongoing';
}
