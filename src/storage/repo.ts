import type { KVStorage } from './storage';
import { emptyState, type AppState } from '../engine/state';
import { migrate } from '../engine/data';
export const KEY = 'state-v1';
export const PRE_IMPORT_KEY = 'backup-before-import';
export const CORRUPT_PREFIX = 'unreadable-';
export interface LoadResult { state: AppState; recovered?: string; migrated?: boolean }
/** Load, migrate and validate. Unreadable data is never deleted: it is kept under a separate key and the app starts fresh. */
export async function loadStateSafe(s: KVStorage, now = Date.now()): Promise<LoadResult> {
  const raw = await s.get<unknown>(KEY);
  if (raw === undefined) return { state: emptyState() };
  try {
    const before = (raw as { schema?: number })?.schema;
    const state = migrate(raw);
    if (before !== state.schema) await s.set(KEY, state);
    return { state, migrated: before !== state.schema };
  } catch (e) {
    const key = `${CORRUPT_PREFIX}${now}`;
    await s.set(key, raw);
    const state = emptyState(); await s.set(KEY, state);
    return { state, recovered: `${(e as Error).message} The unreadable data was kept on this device (${key}) and the app started fresh. Import a backup to restore your progress.` };
  }
}
export const loadState = async (s: KVStorage) => (await loadStateSafe(s)).state;
export const saveState = (s: KVStorage, st: AppState) => s.set(KEY, st);
export const deleteAll = (s: KVStorage) => s.clear();
export const backupBeforeImport = (s: KVStorage, st: AppState) => s.set(PRE_IMPORT_KEY, { at: Date.now(), state: st });
export const readPreImportBackup = (s: KVStorage) => s.get<{ at: number; state: AppState }>(PRE_IMPORT_KEY);
