import { z } from 'zod';
import { nullableOptional } from '../../shared/lib/zodHelpers';

export const StaySchema = z.object({
  id: z.string(),
  legId: nullableOptional(z.string()),
  name: z.string().min(1, 'Το όνομα είναι υποχρεωτικό'),
  address: z.string().min(1, 'Η διεύθυνση είναι υποχρεωτική'),
  phone: nullableOptional(z.string()),
  checkinDate: z.string().min(1, 'Η ημερομηνία check-in είναι υποχρεωτική'),
  checkinTime: z.string().min(1, 'Η ώρα check-in είναι υποχρεωτική'),
  checkoutDate: z.string().min(1, 'Η ημερομηνία check-out είναι υποχρεωτική'),
  checkoutTime: z.string().min(1, 'Η ώρα check-out είναι υποχρεωτική'),
  bookingRef: nullableOptional(z.string()),
  notes: nullableOptional(z.string()),
  link: nullableOptional(z.string()),
});

export type Stay = z.infer<typeof StaySchema>;
