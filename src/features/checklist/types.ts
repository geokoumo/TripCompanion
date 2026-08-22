import { z } from 'zod';

export const ChecklistItemSchema = z.object({
  id: z.string(),
  travelerId: z.string(),
  text: z.string().min(1, 'Το πεδίο είναι υποχρεωτικό'),
  category: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  done: z.boolean().default(false),
  link: z.string().optional(),
});

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
