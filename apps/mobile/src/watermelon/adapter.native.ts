// Native adapter (iOS/Android): high-performance JSI SQLite.
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { watermelonSchema } from './schema';
import { watermelonMigrations } from './migrations';

export function createAdapter() {
  return new SQLiteAdapter({
    schema: watermelonSchema,
    migrations: watermelonMigrations,
    jsi: true,
    onSetUpError: (error) => {
      console.error('WatermelonDB setup error:', error);
    },
  });
}
