import { SCHEMA_VERSION } from '../../config/constants';

type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

/** Keyed by the version being migrated FROM. Add an entry whenever the trip shape changes. */
const migrations: Record<number, Migration> = {
  // Example for future use:
  // 1: (data) => ({ ...data, newField: 'default' }),
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
