import { z } from 'zod';
import { BOOKING_ITEM_TYPES, type BookingItemTypeId } from '../../config/constants';
import { nullableOptional } from '../../shared/lib/zodHelpers';

const bookingTypeIds = BOOKING_ITEM_TYPES.map((t) => t.id) as [BookingItemTypeId, ...BookingItemTypeId[]];

export const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'] as const;
export type PriceRange = (typeof PRICE_RANGES)[number];

/**
 * Type-specific fields that only make sense for one booking type (cuisine
 * and price range for a restaurant, car/seat/platform for transport, the
 * sub-category for a sight) — a flexible bag rather than a rigid column per
 * type. Every field is optional and the object defaults to `{}` so it never
 * blocks saving a booking that doesn't use any of them.
 */
export const BookingItemDetailsSchema = z
  .object({
    category: nullableOptional(z.string()), // sight / ticket / activity / other
    cuisineType: nullableOptional(z.string()), // restaurant
    priceRange: nullableOptional(z.enum(PRICE_RANGES)), // restaurant / bar
    fromLocation: nullableOptional(z.string()), // transport
    toLocation: nullableOptional(z.string()), // transport
    car: nullableOptional(z.string()), // transport
    seat: nullableOptional(z.string()), // transport
    platform: nullableOptional(z.string()), // transport
  })
  .default({});

export type BookingItemDetails = z.infer<typeof BookingItemDetailsSchema>;

export const BookingItemSchema = z.object({
  id: z.string(),
  legId: nullableOptional(z.string()),
  type: z.enum(bookingTypeIds),
  name: z.string().min(1, 'Name is required'),
  location: nullableOptional(z.string()),
  address: nullableOptional(z.string()),
  date: nullableOptional(z.string()),
  startTime: nullableOptional(z.string()),
  endTime: nullableOptional(z.string()),
  price: nullableOptional(z.number().nonnegative()),
  currency: nullableOptional(z.string()),
  bookingReference: nullableOptional(z.string()),
  notes: nullableOptional(z.string()),
  partySize: nullableOptional(z.number().int().positive()),
  details: BookingItemDetailsSchema,
});

export type BookingItem = z.infer<typeof BookingItemSchema>;
