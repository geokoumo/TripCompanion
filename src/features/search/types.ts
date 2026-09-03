import { z } from 'zod';
import { TRIP_TABS } from '../trips/types';

export const SEARCH_MATCH_TYPES = ['flight', 'stay', 'stop', 'expense'] as const;
export type SearchMatchType = (typeof SEARCH_MATCH_TYPES)[number];

export const SearchMatchSchema = z.object({
  type: z.enum(SEARCH_MATCH_TYPES),
  id: z.string(),
  label: z.string(),
  tab: z.enum(TRIP_TABS),
});
export type SearchMatch = z.infer<typeof SearchMatchSchema>;

export const SearchResultGroupSchema = z.object({
  tripId: z.string(),
  tripTitle: z.string(),
  matches: z.array(SearchMatchSchema),
});
export type SearchResultGroup = z.infer<typeof SearchResultGroupSchema>;
