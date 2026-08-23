import { z } from 'zod';
import { LegSchema } from './types';

/** Generic date-order check reused across trips, legs, stays. Equal dates are valid. */
export function isEndOnOrAfterStart(startDate: string, endDate: string): boolean {
  return endDate >= startDate;
}

// Wizard step 1 ("Βασικά") draft shape — these dates seed the trip's first leg;
// Trip itself never stores a top-level date range (it's derived from legs/flights).
export const TripFormSchema = z
  .object({
    title: z.string().min(1, 'Ο τίτλος είναι υποχρεωτικός'),
    startDate: z.string().min(1, 'Η ημερομηνία έναρξης είναι υποχρεωτική'),
    endDate: z.string().min(1, 'Η ημερομηνία λήξης είναι υποχρεωτική'),
  })
  .superRefine((data, ctx) => {
    if (!isEndOnOrAfterStart(data.startDate, data.endDate)) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'Η ημερομηνία λήξης πρέπει να είναι μετά την έναρξη',
      });
    }
  });

export const LegFormSchema = LegSchema.superRefine((data, ctx) => {
  if (!isEndOnOrAfterStart(data.startDate, data.endDate)) {
    ctx.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'Η ημερομηνία λήξης πρέπει να είναι μετά την έναρξη',
    });
  }
});

export type TripFormValues = z.infer<typeof TripFormSchema>;
export type LegFormValues = z.infer<typeof LegFormSchema>;
