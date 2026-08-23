import { SCHEMA_VERSION } from '../../config/constants';

type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

const OLD_TO_NEW_AVATAR_COLOR: Record<string, string> = {
  rust: 'avatar-1',
  teal: 'avatar-2',
  brass: 'avatar-3',
  purple: 'avatar-4',
  gray: 'avatar-1',
};

/** Keyed by the version being migrated FROM. Add an entry whenever the trip shape changes. */
const migrations: Record<number, Migration> = {
  // v1 -> v2: trip.startDate/endDate are no longer stored (derived from legs/flights
  // instead), and the avatar palette shrank from 5 named colors to a fixed 4-color cycle.
  1: (data) => {
    const legs = Array.isArray(data.legs) ? (data.legs as Record<string, unknown>[]) : [];
    const hasLegs = legs.length > 0;
    const startDate = typeof data.startDate === 'string' ? data.startDate : undefined;
    const endDate = typeof data.endDate === 'string' ? data.endDate : undefined;

    const migratedLegs = hasLegs
      ? legs
      : startDate && endDate
        ? [
            {
              id: `leg-${data.id ?? 'migrated'}`,
              city: '',
              country: '',
              startDate,
              endDate,
              currency: typeof data.homeCurrency === 'string' ? data.homeCurrency : 'EUR',
            },
          ]
        : [];

    const travelers = Array.isArray(data.travelers) ? (data.travelers as Record<string, unknown>[]) : [];
    const migratedTravelers = travelers.map((t) => ({
      ...t,
      avatarColor: OLD_TO_NEW_AVATAR_COLOR[t.avatarColor as string] ?? 'avatar-1',
    }));

    const { startDate: _s, endDate: _e, ...rest } = data;
    return { ...rest, legs: migratedLegs, travelers: migratedTravelers };
  },
};

/** Runs any pending migrations on a raw persisted trip object, bringing it up to SCHEMA_VERSION. */
export function migrateTrip(raw: Record<string, unknown>): Record<string, unknown> {
  let data = raw;
  let version = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0;

  while (version < SCHEMA_VERSION) {
    const migrate = migrations[version];
    if (!migrate) break;
    data = migrate(data);
    version += 1;
  }

  return { ...data, schemaVersion: SCHEMA_VERSION };
}
