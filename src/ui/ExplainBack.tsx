import { useState } from 'react';
import type { ExplainBack as E } from '../content/types';

export const RUBRIC = [
  'Accuracy: covers the key ideas without errors',
  'Own words: explained in my words, not copied',
  'Example: includes a concrete example from my life',
  'Boundaries: says what the idea is not, or when it does not apply',
  'Use: says how I will apply it',
];
const LEVELS = ['Not yet', 'Partly', 'Yes'];

/** Layer 2 explanation-back with a transparent rubric and self-assessment. The app never grades the text. */
export function ExplainBack({ e, initial, onSave, onSkip }: { e: E; initial?: string; onSave: (text: string, self: number[], revised: boolean) => void; onSkip: () => void }) {
  const [text, setText] = useState(initial ?? '');
  const [stage, setStage] = useState<'write' | 'compare'>('write');
  const [self, setSelf] = useState<number[]>(RUBRIC.map(() => -1));
  const [revised, setRevised] = useState(false);
  return (<section className="card" aria-label="Explain it back">
    <p className="kicker"><span aria-hidden>💬</span> Explain</p>
    <h2>Explain it back</h2>
    <p>{e.prompt}</p>
    <details className="rubric" open><summary>Rubric you will use to check yourself</summary><ul>{RUBRIC.map(r => <li key={r}>{r}</li>)}</ul></details>
    <p className="small muted notice">This app does not read, score or grade what you write. You compare it with the model key points and rate yourself. Your text stays on this device.</p>
    {stage === 'write' && <>
      <label htmlFor="xb" className="field">Your explanation</label>
      <textarea id="xb" rows={6} value={text} onChange={ev => setText(ev.target.value)} />
      <p className="small muted">{text.trim().split(/\s+/).filter(Boolean).length} words. Aim for about 60 to 150.</p>
      <div className="row-btns"><button className="primary" disabled={text.trim().length < 20} onClick={() => setStage('compare')}>Compare with model key points</button>
        <button onClick={onSkip}>Skip for now</button></div></>}
    {stage === 'compare' && <>
      <div className="split"><div><h3>Your explanation</h3><p className="quote">{text}</p></div>
        <div><h3>Model key points</h3><ul>{e.keyPoints.map(k => <li key={k}>{k}</li>)}</ul></div></div>
      <h3>Rate yourself</h3>
      {RUBRIC.map((r, i) => <fieldset key={r} className="rating"><legend>{r}</legend><div className="chips">
        {LEVELS.map((l, k) => <label key={l} className="chip"><input type="radio" name={`rb-${i}`} checked={self[i] === k} onChange={() => setSelf(s => s.map((v, j) => j === i ? k : v))} /> {l}</label>)}</div></fieldset>)}
      {self.some(v => v === 0) && <p className="small">Any "Not yet"? Revising once is usually worth it: add the missing point in your own words.</p>}
      <div className="row-btns"><button className="primary" disabled={self.includes(-1)} onClick={() => onSave(text, self, revised)}>Save self-assessment</button>
        <button onClick={() => { setRevised(true); setStage('write'); }}>Revise my explanation</button></div></>}
  </section>);
}
