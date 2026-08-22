import { z } from 'zod';
import { TRAVELER_AVATAR_COLORS } from '../../config/constants';

export const TravelerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Το όνομα είναι υποχρεωτικό'),
  avatarColor: z.enum(TRAVELER_AVATAR_COLORS),
});

export type Traveler = z.infer<typeof TravelerSchema>;
