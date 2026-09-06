import { z } from 'zod';
import { LegSchema } from './types';

/** Generic date-order check reused across trips, legs, stays. Equal dates are valid. */
export function isEndOnOrAfterStart(startDate: string, endDate: string): boolean {
  return endDate >= startDate;
}

// Wizard step 1 ("Basics") draft shape — these dates seed the trip's first leg;
// Trip itself never stores a top-level date range (it's derived from legs/flights).
export const TripFormSchema = z
  .object({
    title: z.string().min(1, 'A title is required'),
    startDate: z.string().min(1, 'A start date is required'),
    endDate: z.string().min(1, 'An end date is required'),
  })
  .superRefine((data, ctx) => {
    if (!isEndOnOrAfterStart(data.startDate, data.endDate)) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'The end date must be after the start date',
      });
    }
  });

export const LegFormSchema = LegSchema.superRefine((data, ctx) => {
  if (!isEndOnOrAfterStart(data.startDate, data.endDate)) {
    ctx.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'The end date must be after the start date',
    });
  }
});

export type TripFormValues = z.infer<typeof TripFormSchema>;
export type LegFormValues = z.infer<typeof LegFormSchema>;
