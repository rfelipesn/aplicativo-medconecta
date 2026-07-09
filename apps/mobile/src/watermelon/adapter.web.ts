// Web adapter: only in-memory LokiJS. Do not import any native SQLite adapter
// or better-sqlite3 here, because Expo Web cannot bundle native modules.
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { watermelonSchema } from './schema';
import { watermelonMigrations } from './migrations';

export function createAdapter() {
  return new LokiJSAdapter({
    schema: watermelonSchema,
    migrations: watermelonMigrations,
    dbName: 'medconecta-web-memory',
    useWebWorker: false,
    useIncrementalIndexedDB: false,
    onSetUpError: (error) => {
      console.error('WatermelonDB (web/LokiJS) setup error:', error);
    },
  });
}
