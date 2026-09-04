import { z } from 'zod';
import { nullableOptional } from '../../shared/lib/zodHelpers';

export const ChecklistItemSchema = z.object({
  id: z.string(),
  travelerId: z.string(),
  text: z.string().min(1, 'Το πεδίο είναι υποχρεωτικό'),
  category: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  done: z.boolean().default(false),
  link: nullableOptional(z.string()),
});

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
