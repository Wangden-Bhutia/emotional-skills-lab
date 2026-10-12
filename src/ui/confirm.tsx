import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Req { title: string; body: ReactNode; confirm: string; danger?: boolean; typed?: string; resolve: (ok: boolean) => void }
type Ask = (o: Omit<Req, 'resolve'>) => Promise<boolean>;

/** In-app replacement for window.confirm(): a modal <dialog> with a clear consequence, Escape to cancel, and optional typed confirmation. */
export function useConfirm(): [Ask, ReactNode] {
  const [req, setReq] = useState<Req | null>(null);
  const ask: Ask = o => new Promise<boolean>(resolve => setReq({ ...o, resolve }));
  const node = req ? <ConfirmDialog key={req.title} req={req} onClose={ok => { req.resolve(ok); setReq(null); }} /> : null;
  return [ask, node];
}

function ConfirmDialog({ req, onClose }: { req: Req; onClose: (ok: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState('');
  useEffect(() => {
    const d = ref.current; const opener = document.activeElement as HTMLElement | null;
    if (d && typeof d.showModal === 'function' && !d.open) d.showModal(); else d?.setAttribute('open', '');
    // Start on the safe choice: the typed-confirmation field when there is one, otherwise Cancel.
    d?.querySelector<HTMLElement>(req.typed ? 'input' : '[data-cancel]')?.focus();
    return () => { opener?.focus?.(); };
  }, [req.typed]);
  const ok = !req.typed || typed.trim().toUpperCase() === req.typed;
  return (
    <dialog ref={ref} className="confirm" aria-labelledby="confirm-h" aria-describedby="confirm-b" onCancel={e => { e.preventDefault(); onClose(false); }}>
      <h2 id="confirm-h">{req.title}</h2>
      <div id="confirm-b">{req.body}</div>
      {req.typed && <label className="field">Type {req.typed} to confirm<input value={typed} onChange={e => setTyped(e.target.value)} autoComplete="off" /></label>}
      <div className="row-btns">
        <button data-cancel onClick={() => onClose(false)}>Cancel</button>
        <button className={req.danger ? 'danger solid' : 'primary'} disabled={!ok} onClick={() => onClose(true)}>{req.confirm}</button>
      </div>
    </dialog>
  );
}
