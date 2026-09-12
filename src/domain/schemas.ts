import { z } from 'zod';
import {
  BOOKING_ITEM_TYPES,
  DOCUMENT_CATEGORIES,
  DOCUMENT_FILE_TYPES,
  FLIGHT_STATUSES,
  ITINERARY_STOP_TYPES,
  TRAVELER_AVATAR_COLORS,
} from '../config/constants';

/**
 * Domain-layer types and schemas — the framework-independent shape of a
 * trip and everything in it, used by the business-rule functions in this
 * package (validateActivity, detectActivityOverlap, ...).
 *
 * This is deliberately separate from src/features/*\/types.ts, which are
 * each feature's current persistence/UI shape. Field names are kept aligned
 * with those wherever the same concept already exists there, so wiring a
 * screen up to this engine later is a type-level exercise, not a rename.
 * Where the product spec calls for a check the current persisted shape
 * doesn't carry yet (e.g. an Activity's price/currency), the field is added
 * here as optional rather than bolted onto the shipped schema.
 *
 * Only `zod` and the shared id/label constants are imported here — nothing
 * in src/domain may import from src/features or src/app, so the dependency
 * direction always runs feature -> domain, never the reverse.
 */

const activityTypeIds = ITINERARY_STOP_TYPES.map((t) => t.id) as [string, ...string[]];
const bookingTypeIds = BOOKING_ITEM_TYPES.map((t) => t.id) as [string, ...string[]];
const documentCategoryIds = DOCUMENT_CATEGORIES.map((c) => c.id) as [string, ...string[]];
const flightStatusIds = FLIGHT_STATUSES.map((s) => s.id) as [string, ...string[]];

const optionalString = z.string().optional();
const optionalNumber = z.number().optional();

export const TravelerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  avatarColor: z.enum(TRAVELER_AVATAR_COLORS).optional(),
});
export type Traveler = z.infer<typeof TravelerSchema>;

export const ActivitySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(activityTypeIds),
  date: z.string(),
  allDay: z.boolean().default(false),
  /** Required unless allDay — enforced by validateTimeRange/validateRequiredData, not by the schema shape itself. */
  time: optionalString,
  durationMinutes: optionalNumber,
  location: optionalString,
  price: optionalNumber,
  currency: optionalString,
  notes: optionalString,
  link: optionalString,
  travelerIds: z.array(z.string()).default([]),
  done: z.boolean().default(false),
});
export type Activity = z.infer<typeof ActivitySchema>;

export const FlightSchema = z.object({
  id: z.string().min(1),
  airline: z.string().min(1),
  flightNumber: z.string().min(1),
  depAirport: z.string().min(1),
  depDate: z.string(),
  depTime: z.string(),
  arrAirport: z.string().min(1),
  arrDate: z.string(),
  arrTime: z.string(),
  status: z.enum(flightStatusIds).default('scheduled'),
  price: optionalNumber,
  currency: optionalString,
  bookingReference: optionalString,
});
export type Flight = z.infer<typeof FlightSchema>;

export const StaySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  checkinDate: z.string(),
  checkinTime: z.string(),
  checkoutDate: z.string(),
  checkoutTime: z.string(),
  price: optionalNumber,
  currency: optionalString,
  bookingReference: optionalString,
});
export type Stay = z.infer<typeof StaySchema>;

export const BookingSchema = z.object({
  id: z.string().min(1),
  type: z.enum(bookingTypeIds),
  name: z.string().min(1),
  location: optionalString,
  date: optionalString,
  startTime: optionalString,
  endTime: optionalString,
  price: optionalNumber,
  currency: optionalString,
  bookingReference: optionalString,
});
export type Booking = z.infer<typeof BookingSchema>;

export const DocumentSchema = z.object({
  id: z.string().min(1),
  category: z.enum(documentCategoryIds),
  title: z.string().min(1),
  fileType: z.enum(DOCUMENT_FILE_TYPES),
  storagePath: z.string().min(1),
  relatedTo: optionalString,
  uploadedAt: z.string(),
});
export type Document = z.infer<typeof DocumentSchema>;

export const ExpenseSchema = z.object({
  id: z.string().min(1),
  amount: z.number(),
  currency: z.string().min(1),
  categoryId: z.string().min(1),
  date: z.string(),
  paidBy: z.string().min(1),
  splitAmong: z.array(z.string()).default([]),
  note: optionalString,
});
export type Expense = z.infer<typeof ExpenseSchema>;

export const PackingItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  category: z.string().min(1),
  travelerId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  done: z.boolean().default(false),
});
export type PackingItem = z.infer<typeof PackingItemSchema>;

export const TripSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  homeCurrency: z.string().min(1).default('EUR'),
  travelers: z.array(TravelerSchema).default([]),
  activities: z.array(ActivitySchema).default([]),
  flights: z.array(FlightSchema).default([]),
  stays: z.array(StaySchema).default([]),
  bookings: z.array(BookingSchema).default([]),
  documents: z.array(DocumentSchema).default([]),
  expenses: z.array(ExpenseSchema).default([]),
  packingItems: z.array(PackingItemSchema).default([]),
});
export type Trip = z.infer<typeof TripSchema>;

export interface DateRange {
  startDate: string;
  endDate: string;
}
