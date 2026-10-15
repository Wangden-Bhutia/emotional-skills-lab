import { useMemo, useState } from 'react';
import type { Activity as A } from '../content/types';
import { IconPencil } from './icons';

/** Stable, non-random reordering so displayed order differs from the answer order but is the same on every visit. */
const rotate = <T,>(a: T[]) => a.length < 2 ? a : [...a.slice(Math.ceil(a.length / 2)), ...a.slice(0, Math.ceil(a.length / 2))].reverse();

/** Layer 1 interactive activity. All controls are native buttons, radios or selects: keyboard and screen-reader operable, no drag. */
export function Activity({ a, onDone }: { a: A; onDone: (correct: number, total: number) => void }) {
  const [checked, setChecked] = useState(false);
  const [ans, setAns] = useState<Record<number, number>>({});
  const order = useMemo(() => a.type === 'sequence' ? rotate(a.steps.map((_, i) => i)) : [], [a]);
  const [seq, setSeq] = useState<number[]>(order);
  const rights = useMemo(() => a.type === 'match' ? rotate(a.pairs.map((p) => p.right)) : [], [a]);
  const check = (correct: number, total: number) => { setChecked(true); onDone(correct, total); };
  const kind = { classify: 'Sort it', sequence: 'Put in order', match: 'Match up', predict: 'Predict', compare: 'Compare' }[a.type];
  return (<section className="card activity" aria-label={`Activity: ${kind}`}>
    <p className="kicker"><IconPencil className="ki" /> Try it · {kind}</p><h2 className="h3">{a.prompt}</h2>
    {a.type === 'classify' && <>
      {a.items.map((it, i) => <fieldset key={i} className="rating"><legend>{it.text}</legend>
        <div className="chips">{a.buckets.map((b, k) => <label key={k} className="chip"><input type="radio" name={`act-${i}`} disabled={checked} checked={ans[i] === k} onChange={() => setAns(x => ({ ...x, [i]: k }))} /> {b}</label>)}</div>
        {checked && <p className={'fbline ' + (ans[i] === it.bucket ? 'ok' : 'no')} role="status">{ans[i] === it.bucket ? 'Correct' : `Better fit: ${a.buckets[it.bucket]}`}. {it.fb}</p>}</fieldset>)}
      {!checked && <button className="primary" disabled={Object.keys(ans).length < a.items.length} onClick={() => check(a.items.filter((it, i) => ans[i] === it.bucket).length, a.items.length)}>Check answers</button>}
    </>}
    {a.type === 'sequence' && <>
      <ol className="seq">{seq.map((si, pos) => <li key={si}><span>{a.steps[si].text}</span>
        {!checked ? <span className="row-btns tight">
          <button aria-label={`Move up: ${a.steps[si].text}`} disabled={pos === 0} onClick={() => setSeq(s => { const n = [...s]; [n[pos - 1], n[pos]] = [n[pos], n[pos - 1]]; return n; })}>↑</button>
          <button aria-label={`Move down: ${a.steps[si].text}`} disabled={pos === seq.length - 1} onClick={() => setSeq(s => { const n = [...s]; [n[pos + 1], n[pos]] = [n[pos], n[pos + 1]]; return n; })}>↓</button></span>
          : <p className={'fbline ' + (si === pos ? 'ok' : 'no')} role="status">{si === pos ? 'Right place' : `Belongs at position ${si + 1}`}. {a.steps[si].fb}</p>}</li>)}</ol>
      {!checked && <button className="primary" onClick={() => check(seq.filter((si, pos) => si === pos).length, seq.length)}>Check order</button>}
    </>}
    {a.type === 'match' && <>
      {a.pairs.map((p, i) => <div key={i} className="field"><label htmlFor={`m-${i}`}>{p.left}</label>
        <select id={`m-${i}`} disabled={checked} value={ans[i] ?? ''} onChange={e => setAns(x => ({ ...x, [i]: +e.target.value }))}>
          <option value="" disabled>Choose…</option>{rights.map((r, k) => <option key={k} value={k}>{r}</option>)}</select>
        {checked && <p className={'fbline ' + (rights[ans[i]] === p.right ? 'ok' : 'no')} role="status">{rights[ans[i]] === p.right ? 'Correct' : `Better match: ${p.right}`}. {p.fb}</p>}</div>)}
      {!checked && <button className="primary" disabled={Object.keys(ans).length < a.pairs.length} onClick={() => check(a.pairs.filter((p, i) => rights[ans[i]] === p.right).length, a.pairs.length)}>Check matches</button>}
    </>}
    {(a.type === 'predict' || a.type === 'compare') && <div className="opts" role="radiogroup" aria-label={a.prompt}>
      {a.options.map((o, k) => <div key={k}><button role="radio" aria-checked={ans[0] === k} disabled={checked} className={'opt' + (checked && o.good ? ' right' : '') + (checked && ans[0] === k && !o.good ? ' wrong' : '')}
        onClick={() => { setAns({ 0: k }); check(o.good ? 1 : 0, 1); }}>{o.text}</button>
        {checked && <p className={'fbline ' + (o.good ? 'ok' : 'no')}>{ans[0] === k ? 'Your choice. ' : ''}{o.fb}</p>}</div>)}
    </div>}
    {checked && <p className="small muted">Activities are practice. They do not count towards mastery.</p>}
  </section>);
}
