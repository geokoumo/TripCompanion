import { z } from 'zod';
import { LegSchema, TripSchema } from './types';

/** Generic date-order check reused across trips, legs, stays. Equal dates are valid. */
export function isEndOnOrAfterStart(startDate: string, endDate: string): boolean {
  return endDate >= startDate;
}

export const TripFormSchema = TripSchema.pick({
  title: true,
  startDate: true,
  endDate: true,
}).superRefine((data, ctx) => {
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
