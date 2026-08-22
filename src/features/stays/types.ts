import { z } from 'zod';

export const StaySchema = z.object({
  id: z.string(),
  legId: z.string().optional(),
  name: z.string().min(1, 'Το όνομα είναι υποχρεωτικό'),
  address: z.string().min(1, 'Η διεύθυνση είναι υποχρεωτική'),
  phone: z.string().optional(),
  checkinDate: z.string().min(1, 'Η ημερομηνία check-in είναι υποχρεωτική'),
  checkinTime: z.string().min(1, 'Η ώρα check-in είναι υποχρεωτική'),
  checkoutDate: z.string().min(1, 'Η ημερομηνία check-out είναι υποχρεωτική'),
  checkoutTime: z.string().min(1, 'Η ώρα check-out είναι υποχρεωτική'),
  bookingRef: z.string().optional(),
  notes: z.string().optional(),
  link: z.string().optional(),
});

export type Stay = z.infer<typeof StaySchema>;
