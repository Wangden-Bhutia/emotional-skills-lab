import { useEffect, useState } from 'react';
interface BIP extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
let deferred: BIP | null = null;
const subs = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e as BIP; subs.forEach(f => f()); });
  window.addEventListener('appinstalled', () => { deferred = null; localStorage.setItem('esl-installed', '1'); subs.forEach(f => f()); });
}
const KEY = 'esl-install-dismissed';
export function InstallCard() {
  const [, force] = useState(0);
  useEffect(() => { const f = () => force(x => x + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  const dismissed = Number(localStorage.getItem(KEY) ?? 0) > Date.now();
  const standalone = matchMedia('(display-mode: standalone)').matches;
  if (!deferred || dismissed || standalone) return null;
  return (<div className="card install" role="region" aria-label="Install app">
    <div><strong>Install Emotional Skills Lab</strong><p className="small">Works offline from your home screen.</p></div>
    <button className="primary" onClick={async () => { const d = deferred; if (!d) return; await d.prompt(); await d.userChoice; deferred = null; force(x => x + 1); }}>Install app</button>
    <button className="icon" aria-label="Dismiss install card" onClick={() => { localStorage.setItem(KEY, String(Date.now() + 3 * 86400000)); force(x => x + 1); }}>×</button>
  </div>);
}
