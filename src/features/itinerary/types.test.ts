import { describe, expect, it } from 'vitest';
import { ItineraryStopSchema } from './types';

// F-12: assignedToNobody is purely additive — a stop persisted before this
// field existed (no key at all in the raw record) must still parse cleanly,
// with the field coming back undefined (falsy), preserving its
// "empty travelerIds = everyone" meaning exactly as before.
describe('ItineraryStopSchema — assignedToNobody backward compatibility', () => {
  const base = {
    id: 'a1',
    date: '2026-09-06',
    time: '10:00',
    allDay: false,
    title: 'Colosseum',
    type: 'sight',
    travelerIds: [],
    done: false,
  };

  it('parses a legacy record with no assignedToNobody key at all', () => {
    const parsed = ItineraryStopSchema.parse(base);
    expect(parsed.assignedToNobody).toBeUndefined();
  });

  it('parses a Supabase-shaped record where the column is explicit SQL null without throwing', () => {
    // nullableOptional is deliberately .nullish() (accepts null, doesn't
    // transform it to undefined) — see shared/lib/zodHelpers.ts's own
    // comment. Reading code already treats null and undefined the same way.
    const parsed = ItineraryStopSchema.parse({ ...base, assignedToNobody: null });
    expect(parsed.assignedToNobody).toBeFalsy();
  });

  it('parses a record with assignedToNobody explicitly true', () => {
    const parsed = ItineraryStopSchema.parse({ ...base, assignedToNobody: true });
    expect(parsed.assignedToNobody).toBe(true);
  });
});
