/** Storage interface. The app only talks to this; IndexedDB is one implementation. */
export interface KVStorage {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}
export class MemoryStorage implements KVStorage {
  private m = new Map<string, unknown>();
  async get<T>(k: string) { return structuredClone(this.m.get(k)) as T | undefined; }
  async set<T>(k: string, v: T) { this.m.set(k, structuredClone(v)); }
  async delete(k: string) { this.m.delete(k); }
  async clear() { this.m.clear(); }
  async keys() { return [...this.m.keys()]; }
}
export const DB_VERSION = 1;
export class IDBStorage implements KVStorage {
  private dbp: Promise<IDBDatabase>;
  constructor(name = 'emotional-skills-lab', private store = 'kv') {
    this.dbp = new Promise((res, rej) => {
      const r = indexedDB.open(name, DB_VERSION);
      // Explicit IndexedDB schema versions. Version 1: one key-value store. App data schema is versioned separately (engine/data.ts).
      r.onupgradeneeded = e => { if (e.oldVersion < 1) r.result.createObjectStore(store); };
      r.onblocked = () => rej(new Error('Storage is blocked by another open tab of this app.'));
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  private async tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
    const db = await this.dbp;
    return new Promise((res, rej) => {
      const t = db.transaction(this.store, mode);
      const req = fn(t.objectStore(this.store));
      t.oncomplete = () => res(req.result as T);
      t.onerror = () => rej(t.error);
    });
  }
  get<T>(k: string) { return this.tx<T | undefined>('readonly', s => s.get(k)); }
  async set<T>(k: string, v: T) { await this.tx('readwrite', s => s.put(v, k)); }
  async delete(k: string) { await this.tx('readwrite', s => s.delete(k)); }
  async clear() { await this.tx('readwrite', s => s.clear()); }
  async keys() { return (await this.tx<IDBValidKey[]>('readonly', s => s.getAllKeys())).map(String); }
}
