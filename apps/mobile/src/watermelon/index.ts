import { Database } from '@nozbe/watermelondb';
import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId';
import { v4 as uuidv4 } from 'uuid';
import { watermelonSchema } from './schema';
import { watermelonMigrations } from './migrations';
import { HeadacheEntry } from './models/HeadacheEntry';
import { SeizureEntry } from './models/SeizureEntry';
import { ChatMessage } from './models/ChatMessage';
// Platform-specific adapter: native uses SQLite (JSI), web uses LokiJS.
// Metro/Metro-web resolve `./adapter` to `./adapter.native.ts` or
// `./adapter.web.ts` automatically based on the target platform.
import { createAdapter } from './adapter';

setGenerator(() => uuidv4());

const adapter = createAdapter();

export const localDatabase = new Database({
  adapter,
  modelClasses: [HeadacheEntry, SeizureEntry, ChatMessage],
});

export { SeizureEntry } from './models/SeizureEntry';
export { createLocalSeizureEntry, observeSeizureEntries } from './seizureRepository';
