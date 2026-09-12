/**
 * TripCompanion domain layer — framework-independent types, schemas, and
 * business rules. Nothing under src/domain imports React or anything from
 * src/app/src/features; this is meant to be depended on BY those layers
 * (Add/Edit Activity, Trip Health, Today, and eventually AI tooling), never
 * the other way around.
 */

export * from './schemas';
export * from './errors';
export { validateRequiredData, type EntityKind } from './validateRequiredData';
export { validateActivityDate } from './validateActivityDate';
export { validateTimeRange, type TimeRangeInput } from './validateTimeRange';
export { validatePriceAndCurrency, type PriceInput } from './validatePriceAndCurrency';
export { validateLocation, type LocationOptions } from './validateLocation';
export { detectActivityOverlap } from './detectActivityOverlap';
export { detectStayOverlap } from './detectStayOverlap';
export { validateActivity, type ActivityValidationContext } from './validateActivity';
export { validateTrip } from './validateTrip';
