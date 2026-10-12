import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { IDBStorage, MemoryStorage, type KVStorage } from '../storage/storage';
import { loadStateSafe, saveState } from '../storage/repo';
import { emptyState, type AppState } from '../engine/state';

interface Ctx { st: AppState; update: (fn: (s: AppState) => AppState) => void; storage: KVStorage; ready: boolean; persistent: boolean; notice: string; clearNotice: () => void }
const C = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(C);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [storage] = useState<KVStorage>(() => (typeof indexedDB !== 'undefined' ? new IDBStorage() : new MemoryStorage()));
  const [st, setSt] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);
  const [persistent, setPersistent] = useState(true);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    loadStateSafe(storage).then(r => { setSt(r.state); if (r.recovered) setNotice(r.recovered); setReady(true); }).catch(() => { setPersistent(false); setReady(true); });
  }, [storage]);
  const update = (fn: (s: AppState) => AppState) => setSt(prev => {
    const n = fn(prev);
    saveState(storage, n).catch(() => setPersistent(false));
    return n;
  });
  return <C.Provider value={{ st, update, storage, ready, persistent, notice, clearNotice: () => setNotice('') }}>{children}</C.Provider>;
}
