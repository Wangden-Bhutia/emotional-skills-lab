import { useState } from 'react';
import type { CheckItem } from '../content/types';

/** Answers one item at a time; first answer counts (retrieval), explanation always shown. */
export function Quiz({ items, onDone, label }: { items: CheckItem[]; onDone: (r: Record<string, boolean>) => void; label: string }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [res, setRes] = useState<Record<string, boolean>>({});
  const it = items[i];
  if (!it) return null;
  const answered = picked !== null;
  return (
    <section className="card" aria-label={label}>
      <p className="muted">{label}: question {i + 1} of {items.length}</p>
      <h3 id={`q-${it.id}`}>{it.q}</h3>
      <div role="radiogroup" aria-labelledby={`q-${it.id}`} className="opts">
        {it.options.map((o, k) => (
          <button key={k} role="radio" aria-checked={picked === k} disabled={answered}
            className={'opt' + (answered && k === it.answer ? ' right' : '') + (answered && picked === k && k !== it.answer ? ' wrong' : '')}
            onClick={() => { setPicked(k); setRes(r => ({ ...r, [it.id]: k === it.answer })); }}>{o}</button>
        ))}
      </div>
      {answered && (
        <div role="status" className="feedback">
          <strong>{picked === it.answer ? 'Correct.' : 'Not quite.'}</strong> {it.why}
          <div><button className="primary" onClick={() => { if (i + 1 < items.length) { setI(i + 1); setPicked(null); } else onDone(res); }}>
            {i + 1 < items.length ? 'Next question' : 'Finish'}</button></div>
        </div>
      )}
    </section>
  );
}
