import { z } from 'zod';

/**
 * An optional field that also accepts SQL NULL as "not set". Postgres RPCs
 * (get_full_trip et al.) build their JSON with jsonb_build_object, which
 * includes an unset nullable column as an explicit `null` value — it never
 * omits the key. A plain `.optional()` schema only accepts `undefined`, so
 * it would throw on every real trip with any unset optional field (no
 * budget, a flight with no booking ref, an all-day stop with no time...).
 *
 * Deliberately `.nullish()` and NOT `.nullish().transform(v => v ?? undefined)`
 * — a transform makes Zod treat the field as a required key typed `T | undefined`,
 * which would force every object literal in the app to spell out `field:
 * undefined` instead of just omitting it. `.nullish()` keeps the key itself
 * optional (`field?: T | null`); reading code already treats null and
 * undefined the same way via truthy checks / `??`, so this is the smaller,
 * non-invasive fix.
 */
export function nullableOptional<T extends z.ZodTypeAny>(schema: T) {
  return schema.nullish();
}
