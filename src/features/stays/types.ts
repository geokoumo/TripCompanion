import { z } from 'zod';
import { nullableOptional } from '../../shared/lib/zodHelpers';

export const StaySchema = z.object({
  id: z.string(),
  legId: nullableOptional(z.string()),
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: nullableOptional(z.string()),
  checkinDate: z.string().min(1, 'Check-in date is required'),
  checkinTime: z.string().min(1, 'Check-in time is required'),
  checkoutDate: z.string().min(1, 'Check-out date is required'),
  checkoutTime: z.string().min(1, 'Check-out time is required'),
  bookingRef: nullableOptional(z.string()),
  notes: nullableOptional(z.string()),
  link: nullableOptional(z.string()),
});

export type Stay = z.infer<typeof StaySchema>;
