import type { KVStorage } from './storage';
import { emptyState, type AppState } from '../engine/state';
const KEY = 'state-v1';
export const loadState = async (s: KVStorage) => (await s.get<AppState>(KEY)) ?? emptyState();
export const saveState = (s: KVStorage, st: AppState) => s.set(KEY, st);
export const deleteAll = (s: KVStorage) => s.clear();
