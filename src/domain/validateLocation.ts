import type { DomainError } from './errors';

export interface LocationOptions {
  /** Set when this specific activity/entity type treats a location as mandatory. Defaults to false — most activities don't require one. */
  required?: boolean;
}

/**
 * Validates an optional location string "where applicable": most entities
 * don't require a location at all, but if one is explicitly provided it
 * must be meaningful text, not just whitespace. `required` lets a caller
 * that DOES need a location for a given type (a product decision made at
 * the call site, not assumed here) turn a missing value into an error too.
 */
export function validateLocation(location: string | null | undefined, { required = false }: LocationOptions = {}): DomainError[] {
  const provided = location !== undefined && location !== null;

  if (!provided) {
    return required ? [{ code: 'MISSING_REQUIRED_DATA', field: 'location' }] : [];
  }

  if (location.trim().length === 0) {
    // Explicitly provided but blank — distinct from not provided at all.
    return [{ code: 'INVALID_LOCATION', field: 'location' }];
  }

  return [];
}
