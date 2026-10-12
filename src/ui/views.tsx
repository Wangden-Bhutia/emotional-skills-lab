import { useEffect, useMemo, useState } from 'react';
import { useApp } from './store';
import { Quiz } from './Quiz';
import { SESSIONS } from '../content/sessions';
import { PHASES } from '../content/phases';
import { SCENARIOS, CATEGORY_LABELS } from '../content/scenarios';
import { SOURCES } from '../content/sources';
import { SELF_RATING_ITEMS, SELF_RATING_SCALE, SJT_ITEMS, KNOWLEDGE_ITEMS, GOALS } from '../content/measures';
import type { ScenarioCategory, CheckItem } from '../content/types';
import { TRANSFER } from '../content/scenarios';
import { CHECKPOINT_DRAW } from '../content/enrich';
import { Activity } from './Activity';
import { ExplainBack } from './ExplainBack';
import {
  checkpointItems, lessonItems, retakeLesson, remediationFor, skillStatus, SKILL_SESSIONS, ITEM_SKILL, postponeFollowup, FOLLOWUP_DAYS,
  ALL_ITEMS, MASTERY_THRESHOLD, REVIEW_INTERVALS_DAYS, answerReview, completeSession, dueReviews, emotionFrequency,
  exportData, followupDue, importData, isUnlocked, metrics, nextSession, phaseMastered, emptyState,
  type Assessment, type JournalEntry,
} from '../engine/state';
import { deleteAll } from '../storage/repo';
import { InstallCard } from './install';

export const go = (h: string) => { location.hash = h; };
const pct = (x: number | null) => (x === null ? 'No data yet' : `${Math.round(x * 100)}%`);
const fmt = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const claimSource = (cid: string) => SOURCES.find(s => s.claims.some(c => c.id === cid));
const EMOTIONS = ['Anger', 'Irritation', 'Frustration', 'Anxiety', 'Fear', 'Sadness', 'Disappointment', 'Hurt', 'Shame', 'Guilt', 'Embarrassment', 'Resentment', 'Overwhelm', 'Calm', 'Content', 'Joy', 'Pride', 'Relief', 'Gratitude', 'Curiosity'];

export function Home() {
  const { st, update } = useApp();
  const fu = followupDue(st);
  const ns = nextSession(st);
  const due = dueReviews(st).length;
  const m = metrics(st);
  const baseline = st.assessments.some(a => a.kind === 'baseline');
  return (<>
    <h1>Today</h1>
    <InstallCard />
    {!baseline && <div className="card accent"><h2>Start with a baseline</h2><p>A 3-minute snapshot so you can compare later. It is optional and stays on this device.</p><button className="primary" onClick={() => go('#/assess/baseline')}>Take baseline</button></div>}
    {fu && <div className="card accent"><h2>Follow-up is due</h2><p>A short check about {fu === 'followup2' ? 2 : 6} weeks after the programme. Optional.</p><div className="row-btns"><button className="primary" onClick={() => go(`#/assess/${fu}`)}>Take follow-up</button><button onClick={() => update(x => postponeFollowup(x))}>Postpone a week</button></div></div>}
    {ns ? <div className="card"><p className="muted">Week {ns.week}, day {ns.day} · {PHASES[ns.phase - 1].title} · about {ns.minutes} min</p><h2>{ns.title}</h2><p>{ns.objective}</p>
      <button className="primary" onClick={() => go(`#/session/${ns.id}`)}>Start session</button></div>
      : <div className="card"><h2>Programme complete</h2><p>Keep skills fresh with reviews and the gym.</p>{!st.assessments.some(a => a.kind === 'post') && <button className="primary" onClick={() => go('#/assess/post')}>Take post-programme check</button>}</div>}
    <div className="grid2">
      <button className="tile" onClick={() => go('#/review')}><strong>{due}</strong><span>reviews due</span></button>
      <button className="tile" onClick={() => go('#/gym')}><strong>{SCENARIOS.length}</strong><span>gym scenarios</span></button>
      <button className="tile" onClick={() => go('#/journal')}><strong>{st.journal.length}</strong><span>journal entries</span></button>
      <button className="tile" onClick={() => go('#/progress')}><strong>{m.masteredPhases}/9</strong><span>phases mastered</span></button>
    </div>
    <p className="muted small">This is skills training, not therapy or crisis care. In an emergency in India, dial 112. <a href="#/help">More on safety</a></p>
  </>);
}

export function Programme() {
  const { st } = useApp();
  return (<><h1>Programme</h1><p className="muted">12 weeks, 9 phases, {SESSIONS.length} sessions. Sessions unlock in order.</p>
    {PHASES.map(p => (
      <section key={p.id} className="card">
        <h2>Phase {p.id}: {p.title} {phaseMastered(st, p.id) && <span className="badge">Mastered</span>}</h2>
        <p className="muted">{p.goal} Weeks {p.weeks.join(' and ')}.</p>
        <ul className="list">{SESSIONS.filter(s => s.phase === p.id).map(s => {
          const done = !!st.completed[s.id], open = isUnlocked(st, s.id);
          return <li key={s.id}><button disabled={!open} onClick={() => go(`#/session/${s.id}`)} className="row">
            <span aria-hidden>{done ? '✓' : open ? '○' : '🔒'}</span><span>W{s.week}D{s.day} · {s.title}<span className="sr-only">{done ? ', completed' : open ? ', available' : ', locked'}</span></span><span className="muted small">{s.kind}</span></button></li>;
        })}</ul>
      </section>))}
  </>);
}

function Breather() {
  const [on, setOn] = useState(false); const [t, setT] = useState(0);
  useEffect(() => { if (!on) return; const id = setInterval(() => setT(x => { if (x >= 59) { setOn(false); return 0; } return x + 1; }), 1000); return () => clearInterval(id); }, [on]);
  const phase = t % 10 < 4 ? 'Breathe in' : 'Breathe out';
  return <div className="card"><h3>One-minute breathing</h3><p aria-live="polite">{on ? `${phase} · ${60 - t}s left` : '4 seconds in, 6 seconds out.'}</p>
    <button onClick={() => { setT(0); setOn(!on); }}>{on ? 'Stop' : 'Start timer'}</button></div>;
}

export function SessionView({ id }: { id: string }) {
  const { st, update } = useApp();
  const s = SESSIONS.find(x => x.id === id);
  const [stage, setStage] = useState<'learn' | 'explain' | 'check' | 'done'>('learn');
  const [reflect, setReflect] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [missed, setMissed] = useState<string[]>([]);
  const [actDone, setActDone] = useState(false);
  const [items, setItems] = useState<CheckItem[]>([]);
  if (!s) return <p>Session not found.</p>;
  if (!isUnlocked(st, s.id)) return <div className="card"><h1>Locked</h1><p>Finish the previous session first.</p><button onClick={() => go('#/programme')}>Programme</button></div>;
  const prev = st.completed[s.id];
  const assess = s.kind === 'checkpoint' || s.kind === 'review';
  const startCheck = () => { setItems(assess ? checkpointItems(st, s.id, CHECKPOINT_DRAW) : lessonItems(st, s.id)); setStage('check'); };
  const prereq = s.prerequisites.map(p => SESSIONS.find(x => x.id === p)!).filter(Boolean);
  const est = s.estimate;
  return (<article>
    <p className="muted">Week {s.week}, day {s.day} · Phase {s.phase}: {PHASES[s.phase - 1].title} · about {s.minutes} min</p>
    <h1>{s.title}</h1><p className="lead">Goal: {s.objective}</p>
    {prev && <p className="badge">Completed {fmt(prev.at)}</p>}
    {stage === 'learn' && <>
      <details className="card small"><summary>Before you start: prerequisites and time</summary>
        <p>{prereq.length ? <>Builds on: {prereq.map(p => <a key={p.id} href={`#/session/${p.id}`}>{p.title} </a>)}</> : 'No prerequisites.'}</p>
        <p className="muted">Time estimate: reading {Math.round(est.reading)}, practice {Math.round(est.practice)}, activity {Math.round(est.activity)}, explain-back {est.explain}, questions {Math.round(est.checks)}, application plan {est.apply} minutes. Estimated, not measured.</p></details>
      <section className="card">{s.teach.map((p, i) => <p key={i}>{p}</p>)}
        <p className="small muted">Evidence: {s.claimIds.map(c => { const src = claimSource(c); return src ? <a key={c} href={`#/library/${src.id}`}>{src.authors.split(',')[0]} ({src.year}) </a> : null; })}</p></section>
      {s.example && <section className="card accent"><h2>Worked example</h2><p>{s.example}</p></section>}
      {s.activity && <Activity a={s.activity} onDone={(c, t) => { setActDone(true); update(x => ({ ...x, activities: { ...x.activities, [s.id]: { at: Date.now(), correct: c, total: t } } })); }} />}
      <section className="card"><h2>Practice exercise</h2><ol>{s.practice.map((p, i) => <li key={i}>{p}</li>)}</ol></section>
      {s.id === 'w03d4' && <Breather />}
      <button className="primary" disabled={!!s.activity && !actDone} onClick={() => setStage('explain')}>{s.activity && !actDone ? 'Complete the activity to continue' : 'Next: explain it back'}</button>
    </>}
    {stage === 'explain' && <ExplainBack e={s.explain} initial={st.explanations?.[s.id]?.at(-1)?.text}
      onSkip={startCheck}
      onSave={(text, self, revised) => { update(x => ({ ...x, explanations: { ...x.explanations, [s.id]: [...(x.explanations?.[s.id] ?? []), { at: Date.now(), text, self, revised }] } })); startCheck(); }} />}
    {stage === 'check' && <Quiz key={items.map(i => i.id).join()} label={assess ? 'Checkpoint' : 'Knowledge check'} items={items} onDone={r => {
      const v = Object.values(r); setScore(v.filter(Boolean).length / v.length); setMissed(remediationFor(r)); setStage('done');
      update(x => prev && !assess ? retakeLesson(x, s.id, r) : completeSession(x, s.id, r));
    }} />}
    {stage === 'done' && <>
      <section className="card">
        <h2>Session complete</h2>
        <p>Score: {pct(score)}. {assess && (score! >= MASTERY_THRESHOLD ? 'Phase mastered. Its items will return as spaced reviews.' : `Below the ${MASTERY_THRESHOLD * 100}% mastery threshold. Revisit the lessons below and retake: a retake uses different questions where available.`)}</p>
        {missed.length > 0 && <div className="feedback"><h3>Remediation</h3><p>Questions you missed come from these skills. Revisit them before retaking:</p>
          <ul>{missed.map(m => { const x = SESSIONS.find(y => y.id === m)!; return <li key={m}><a href={`#/session/${m}`}>{x.title}</a>: {x.objective}</li>; })}</ul></div>}
        <h3>Summary: key points</h3><ul>{s.explain.keyPoints.map(k => <li key={k}>{k}</li>)}</ul>
        <h3>Application task</h3><p>{s.apply}</p>
        <p className="small muted">Sources: {s.claimIds.map(c => { const src = claimSource(c); return src ? <a key={c} href={`#/library/${src.id}`}>{src.authors.split(',')[0]} ({src.year}) </a> : null; })}</p>
        <label htmlFor="refl">Optional reflection: {s.reflect}</label>
        <textarea id="refl" value={reflect} onChange={e => setReflect(e.target.value)} rows={3} />
        <div className="row-btns"><button className="primary" onClick={() => {
          if (reflect.trim()) update(x => ({ ...x, journal: [{ id: crypto.randomUUID(), at: Date.now(), type: 'reflection', emotions: [], note: `${s.title}: ${reflect.trim()}` }, ...x.journal] }));
          go('#/');
        }}>Save and continue</button>
        {assess && score! < MASTERY_THRESHOLD && <button onClick={startCheck}>Retake checkpoint</button>}
        {!assess && <button onClick={startCheck}>Retake with different questions</button>}</div>
      </section></>}
  </article>);
}

const DIFF = ['', 'Easier', 'Moderate', 'Harder'];
export function Gym() {
  const { st } = useApp();
  const [cat, setCat] = useState(''); const [skill, setSkill] = useState(''); const [diff, setDiff] = useState(''); const [ctx, setCtx] = useState('');
  const cats = Object.keys(CATEGORY_LABELS) as ScenarioCategory[];
  const skills = [...new Set(SCENARIOS.map(s => s.skill))].sort();
  const tried = new Set(st.scenarios.map(a => a.scenarioId));
  const list = SCENARIOS.filter(s => (!cat || s.category === cat) && (!skill || s.skill === skill) && (!diff || s.difficulty === +diff) && (!ctx || s.context === ctx));
  return (<><h1>Scenario gym</h1><p className="muted">Practise the full chain: facts, emotions, response, and sometimes a follow-up decision. {tried.size} of {SCENARIOS.length} tried.</p>
    <section className="card filters" aria-label="Filters">
      <label className="field">Situation<select value={cat} onChange={e => setCat(e.target.value)}><option value="">All</option>{cats.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}</select></label>
      <label className="field">Skill<select value={skill} onChange={e => setSkill(e.target.value)}><option value="">All</option>{skills.map(c => <option key={c}>{c}</option>)}</select></label>
      <label className="field">Difficulty<select value={diff} onChange={e => setDiff(e.target.value)}><option value="">All</option>{[1, 2, 3].map(d => <option key={d} value={d}>{DIFF[d]}</option>)}</select></label>
      <label className="field">Context<select value={ctx} onChange={e => setCtx(e.target.value)}><option value="">All</option><option value="everyday">Everyday</option><option value="professional">Professional</option></select></label>
    </section>
    <p role="status" className="small muted">{list.length} scenarios shown.</p>
    {cats.filter(c => list.some(s => s.category === c)).map(c => <section key={c} className="card"><h2>{CATEGORY_LABELS[c]}</h2><ul className="list">
      {list.filter(s => s.category === c).map(s => <li key={s.id}><button className="row" onClick={() => go(`#/gym/${s.id}`)}>
        <span aria-hidden>{tried.has(s.id) ? '✓' : '○'}</span><span>{s.title}{s.followUp ? ' · branching' : ''}</span><span className="muted small">{s.context} · {DIFF[s.difficulty]}</span></button></li>)}
    </ul></section>)}</>);
}

export function ScenarioView({ id }: { id: string }) {
  const { update } = useApp();
  const s = SCENARIOS.find(x => x.id === id);
  const statements = useMemo(() => s ? [...s.facts.map(t => ({ t, fact: true })), ...s.interpretations.map(t => ({ t, fact: false }))].sort((a, b) => a.t.localeCompare(b.t)) : [], [s]);
  const [step, setStep] = useState(0);
  const [marks, setMarks] = useState<Record<number, boolean>>({});
  const [emo, setEmo] = useState<number[]>([]);
  const [resp, setResp] = useState<number | null>(null);
  const [resp2, setResp2] = useState<number | null>(null);
  const [transfer, setTransfer] = useState('');
  if (!s) return <p>Scenario not found.</p>;
  const factsOk = statements.every((x, i) => !!marks[i] === x.fact);
  const Q = ['Likely to backfire', 'Partly effective', 'Skilful'];
  return (<article>
    <p className="muted">{CATEGORY_LABELS[s.category]} · {s.context} · {DIFF[s.difficulty]} · skill: {s.skill}</p>
    <h1>{s.title}</h1><div className="card"><p className="lead">{s.situation}</p></div>
    {step === 0 && <fieldset className="card"><legend><h2>1. Which are camera facts?</h2></legend>
      {statements.map((x, i) => <label key={i} className="check"><input type="checkbox" checked={!!marks[i]} onChange={e => setMarks(m => ({ ...m, [i]: e.target.checked }))} /> {x.t}</label>)}
      <button className="primary" onClick={() => setStep(1)}>Check</button></fieldset>}
    {step === 1 && <div className="card" role="status"><h2>{factsOk ? 'Well separated.' : 'Look again.'}</h2>
      <p>Facts: {s.facts.join('; ')}.</p><p>Interpretations (guesses): {s.interpretations.join('; ')}.</p><button className="primary" onClick={() => setStep(2)}>Next</button></div>}
    {step === 2 && <fieldset className="card"><legend><h2>2. Which emotions are likely here?</h2></legend><p className="muted small">Choose all that fit.</p>
      {s.emotionOptions.map((e, i) => <label key={i} className="check"><input type="checkbox" checked={emo.includes(i)} onChange={ev => setEmo(x => ev.target.checked ? [...x, i] : x.filter(y => y !== i))} /> {e}</label>)}
      <button className="primary" disabled={!emo.length} onClick={() => setStep(3)}>Check</button></fieldset>}
    {step === 3 && <div className="card" role="status"><h2>Emotions</h2><p>Plausible: {s.plausibleEmotions.map(i => s.emotionOptions[i]).join(', ')}. Several can be present at once, and your own reaction may differ. Naming them precisely helps you choose.</p><button className="primary" onClick={() => setStep(4)}>Next</button></div>}
    {step === 4 && <section className="card"><h2>3. Choose a response</h2><div className="opts">
      {s.responses.map((r, i) => <button key={i} className="opt" onClick={() => {
        setResp(i); setStep(5);
        update(x => ({ ...x, scenarios: [...x.scenarios, { scenarioId: s.id, at: Date.now(), emotions: emo, response: i, quality: r.quality, factsOk }] }));
      }}>{r.text}</button>)}</div></section>}
    {step >= 5 && resp !== null && <section className="card" role="status"><h2>Feedback and trade-offs</h2>
      {s.responses.map((r, i) => <div key={i} className={'fb q' + r.quality + (i === resp ? ' chosen' : '')}>
        <p><strong>{i === resp ? 'Your choice: ' : ''}{Q[r.quality]}</strong> · {r.text}</p><p className="small">{r.feedback}</p></div>)}
      <p className="small muted">Ratings reflect this programme's teaching, not a validated scoring key. Context can change what works.</p>
      {step === 5 && <button className="primary" onClick={() => setStep(s.followUp ? 6 : 7)}>{s.followUp ? 'What happens next' : 'Next: reflect'}</button>}</section>}
    {step >= 6 && s.followUp && <section className="card"><h2>4. What happens next</h2><p className="lead">{s.followUp.next[resp!]}</p><h3>{s.followUp.prompt}</h3>
      <div className="opts">{s.followUp.options.map((o, i) => <div key={i}><button className={'opt' + (resp2 === i ? ' chosen' : '')} disabled={resp2 !== null} onClick={() => setResp2(i)}>{o.text}</button>
        {resp2 !== null && <div className={'fb q' + o.quality}><p className="small"><strong>{resp2 === i ? 'Your choice: ' : ''}{Q[o.quality]}.</strong> {o.feedback}</p></div>}</div>)}</div>
      {resp2 !== null && step === 6 && <button className="primary" onClick={() => setStep(7)}>Next: reflect</button>}</section>}
    {step >= 7 && <section className="card"><h2>Reflect and transfer</h2><label htmlFor="tr">{TRANSFER[s.category]}</label>
      <textarea id="tr" rows={3} value={transfer} onChange={e => setTransfer(e.target.value)} />
      <div className="row-btns"><button className="primary" onClick={() => {
        if (transfer.trim()) update(x => ({ ...x, journal: [{ id: crypto.randomUUID(), at: Date.now(), type: 'reflection', emotions: [], note: `Gym, ${s.title}: ${transfer.trim()}` }, ...x.journal] }));
        go('#/gym');
      }}>{transfer.trim() ? 'Save to journal and finish' : 'Finish'}</button></div></section>}
  </article>);
}

export function Review() {
  const { st, update } = useApp();
  const [due] = useState(() => dueReviews(st));
  const [done, setDone] = useState(false);
  if (!due.length || done) return <><h1>Reviews</h1><div className="card"><p>{done ? 'Reviews done. Nice work.' : 'No reviews due.'} Items return {REVIEW_INTERVALS_DAYS.join(', ')} days after a phase is mastered.</p></div></>;
  const objectives = [...new Set(due.map(i => ITEM_SKILL[i]))].map(id => SESSIONS.find(s => s.id === id)!);
  return <><h1>Reviews</h1>
    <details className="card small"><summary>Objectives being reviewed ({objectives.length})</summary><ul>{objectives.map(o => <li key={o.id}>{o.title}: {o.objective}</li>)}</ul></details>
    <Quiz label="Spaced review" items={due.map(i => ALL_ITEMS[i])} onDone={r => { update(x => Object.entries(r).reduce((a, [k, v]) => answerReview(a, k, v), x)); setDone(true); }} /></>;
}

export function Journal() {
  const { st, update } = useApp();
  const [mode, setMode] = useState<'checkin' | 'reflection' | 'plan' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [sel, setSel] = useState<Record<string, number>>({});
  const [f, setF] = useState<Record<string, string>>({});
  const reset = () => { setMode(null); setEditId(null); setSel({}); setF({}); };
  const save = () => {
    const base = editId ? st.journal.find(y => y.id === editId) : undefined;
    const e: JournalEntry = { id: editId ?? crypto.randomUUID(), at: base?.at ?? Date.now(), type: mode!, emotions: Object.entries(sel).map(([name, intensity]) => ({ name, intensity })), ...f, ...(editId ? { editedAt: Date.now() } : {}) };
    update(x => ({ ...x, journal: editId ? x.journal.map(y => y.id === editId ? e : y) : [e, ...x.journal] })); reset();
  };
  const edit = (e: JournalEntry) => {
    setEditId(e.id); setMode(e.type); setSel(Object.fromEntries(e.emotions.map(x => [x.name, x.intensity])));
    const { trigger, facts, interpretation, urge, strategy, outcome, lesson, note } = e;
    setF(Object.fromEntries(Object.entries({ trigger, facts, interpretation, urge, strategy, outcome, lesson, note }).filter(([, v]) => v !== undefined)) as Record<string, string>);
    window.scrollTo(0, 0);
  };
  const fld = (k: keyof JournalEntry, label: string) => <label key={k} className="field">{label}<textarea rows={2} value={f[k] ?? ''} onChange={e => setF(x => ({ ...x, [k]: e.target.value }))} /></label>;
  return (<><h1>Journal</h1><p className="muted">Short by design. Stored only on this device.</p>
    {!mode && <div className="row-btns"><button className="primary" onClick={() => setMode('checkin')}>Quick check-in</button><button onClick={() => setMode('reflection')}>Full reflection</button><button onClick={() => setMode('plan')}>If-then plan</button></div>}
    {mode && <section className="card"><h2>{editId ? 'Edit entry' : { checkin: 'Quick check-in', reflection: 'Reflection', plan: 'If-then plan' }[mode]}</h2>
      {mode !== 'plan' && <fieldset><legend>Emotions (up to 3), tap to add</legend><div className="chips">
        {EMOTIONS.map(e => <button key={e} aria-pressed={e in sel} className="chip" onClick={() => setSel(x => { const n = { ...x }; if (e in n) delete n[e]; else if (Object.keys(n).length < 3) n[e] = 5; return n; })}>{e}</button>)}</div>
        {Object.entries(sel).map(([e, v]) => <label key={e} className="field">{e} intensity: {v}<input type="range" min={0} max={10} value={v} onChange={ev => setSel(x => ({ ...x, [e]: +ev.target.value }))} /></label>)}</fieldset>}
      {mode === 'checkin' && fld('note', 'One line (optional)')}
      {mode === 'reflection' && [fld('trigger', 'Situation or trigger'), fld('facts', 'Camera facts'), fld('interpretation', 'My interpretation'), fld('urge', 'Urge'), fld('strategy', 'Strategy I used'), fld('outcome', 'Outcome'), fld('lesson', 'Lesson or next time'), ...(f.note !== undefined ? [fld('note', 'Note')] : [])]}
      {mode === 'plan' && [fld('trigger', 'If (situation or cue)'), fld('strategy', 'Then I will')]}
      <div className="row-btns"><button className="primary" onClick={save}>{editId ? 'Save changes' : 'Save'}</button><button onClick={reset}>Cancel</button></div></section>}
    <ul className="list">{st.journal.map(e => <li key={e.id} className="card entry"><p className="muted small">{fmt(e.at)} · {e.type}{e.editedAt ? ` · edited ${fmt(e.editedAt)}` : ''}</p>
      {e.emotions.length > 0 && <p>{e.emotions.map(x => `${x.name} ${x.intensity}`).join(', ')}</p>}
      {e.type === 'plan' ? <p>If {e.trigger}, then {e.strategy}.</p> : [e.trigger, e.facts, e.interpretation, e.urge, e.strategy, e.outcome, e.lesson, e.note].filter(Boolean).map((t, i) => <p key={i}>{t}</p>)}
      <div className="row-btns"><button className="link" onClick={() => edit(e)}>Edit entry</button>
        <button className="link" onClick={() => { if (confirm('Delete this entry?')) update(x => ({ ...x, journal: x.journal.filter(y => y.id !== e.id) })); }}>Delete entry</button></div></li>)}</ul>
  </>);
}

const KIND_LABEL: Record<Assessment['kind'], string> = { baseline: 'Baseline', post: 'Post-programme', followup2: 'Follow-up (about 2 weeks)', followup6: 'Follow-up (about 6 weeks)', followup: 'Follow-up (earlier version)' };
export function Progress() {
  const { st, update } = useApp();
  const m = metrics(st);
  const freq = emotionFrequency(st).slice(0, 6);
  const A = (k: Assessment['kind']) => st.assessments.filter(a => a.kind === k).at(-1);
  const avg = (a?: Assessment) => a ? (a.selfRatings.reduce((x, y) => x + y, 0) / a.selfRatings.length + 1).toFixed(1) : 'Not taken';
  const fu = followupDue(st);
  return (<><h1>Progress</h1>
    <section className="card"><h2>Separate measures</h2>
      <dl className="metrics"><div><dt>Completion</dt><dd>{pct(m.completion)}</dd><dd className="small muted">Sessions finished. Does not mean mastered.</dd></div>
        <div><dt>Phase mastery</dt><dd>{m.masteredPhases} of 9 phases</dd><dd className="small muted">Checkpoint score of {MASTERY_THRESHOLD * 100}% or more (design choice).</dd></div>
        <div><dt>Skill mastery</dt><dd>{m.masteredSkills} of {SKILL_SESSIONS.length} skills</dd><dd className="small muted">Latest checkpoint and review answers per skill.</dd></div>
        <div><dt>Retention</dt><dd>{pct(m.retention)}</dd><dd className="small muted">Correct on delayed reviews ({m.reviewsDone} answered).</dd></div>
        <div><dt>Scenario quality</dt><dd>{pct(m.scenarioQuality)}</dd><dd className="small muted">Average rating of gym responses.</dd></div></dl></section>
    <section className="card"><h2>Phase mastery</h2><table><thead><tr><th>Phase</th><th>Best score</th><th>Status</th></tr></thead><tbody>
      {PHASES.map(p => { const r = st.phaseResults[p.id] ?? []; const best = r.length ? Math.max(...r.map(x => x.score)) : null;
        return <tr key={p.id}><td>{p.id}. {p.title}</td><td>{pct(best)}</td><td>{phaseMastered(st, p.id) ? 'Mastered' : r.length ? 'Retake' : 'Not yet'}</td></tr>; })}</tbody></table></section>
    <section className="card"><h2>Skills</h2><p className="small muted">A skill is mastered when your latest answers on at least 2 of its items in checkpoints or reviews are {MASTERY_THRESHOLD * 100}% correct. "Needs practice" links back to the lesson.</p>
      <details><summary>Show all {SKILL_SESSIONS.length} skills</summary><ul className="list">{SKILL_SESSIONS.map(s => { const k = skillStatus(st, s.id);
        return <li key={s.id}>{k.status === 'needs practice' ? <a href={`#/session/${s.id}`}>{s.title}</a> : s.title}: <span className="badge">{k.status}</span>{k.score !== null && <span className="small muted"> {pct(k.score)} of {k.answered}</span>}</li>; })}</ul></details></section>
    <section className="card"><h2>Baseline, post and follow-ups</h2>
      <p className="small muted">Original, non-validated items written for this app. Each result is kept separately and never merged. Use them for personal reflection only; changes may reflect many factors.</p>
      <table><thead><tr><th></th><th>Self-rating (1 to 5)</th><th>Confidence</th><th>Knowledge</th><th>Situations</th></tr></thead><tbody>
        {(['baseline', 'post', 'followup2', 'followup6'] as const).map(k => { const a = A(k); return <tr key={k}><td>{KIND_LABEL[k]}</td><td>{avg(a)}</td><td>{a?.confidence !== undefined ? `${a.confidence}/10` : '-'}</td><td>{a?.knowledgeTotal ? `${a.knowledgeCorrect}/${a.knowledgeTotal}` : '-'}</td><td>{a ? `${a.sjtCorrect}/${a.sjtTotal}` : '-'}</td></tr>; })}</tbody></table>
      {A('baseline')?.goals?.length ? <p className="small">Your baseline goals: {A('baseline')!.goals!.join('; ')}{A('baseline')!.goalNote ? `; ${A('baseline')!.goalNote}` : ''}</p> : null}
      <div className="row-btns">{!A('baseline') && <button onClick={() => go('#/assess/baseline')}>Take baseline</button>}
        {nextSession(st) === undefined && !A('post') && <button onClick={() => go('#/assess/post')}>Take post check</button>}
        {fu && <><button onClick={() => go(`#/assess/${fu}`)}>Take {KIND_LABEL[fu].toLowerCase()}</button><button onClick={() => update(x => postponeFollowup(x))}>Postpone a week</button></>}</div>
      <p className="small muted">Post check unlocks after all sessions. Follow-ups are offered about {FOLLOWUP_DAYS.followup2} and {FOLLOWUP_DAYS.followup6} days after the post check; you can postpone or turn them off in Settings.</p></section>
    <section className="card"><h2>Patterns from your journal</h2>{freq.length ? <ul>{freq.map(([e, n]) => <li key={e}>{e}: {n}</li>)}</ul> : <p>No check-ins yet.</p>}
      <p className="small muted">These are descriptive counts, not explanations of causes.</p></section>
  </>);
}

export function AssessView({ kind }: { kind: Assessment['kind'] }) {
  const { update } = useApp();
  const [ratings, setRatings] = useState<number[]>(SELF_RATING_ITEMS.map(() => -1));
  const [goals, setGoals] = useState<string[]>([]);
  const [goalNote, setGoalNote] = useState('');
  const [confidence, setConfidence] = useState(5);
  const [know, setKnow] = useState<number | null>(null);
  const [explanation, setExplanation] = useState('');
  const [part, setPart] = useState<1 | 2 | 3 | 4 | 5>(1);
  const save = (sjt: number) => update(x => ({ ...x, assessments: [...x.assessments, {
    kind, at: Date.now(), selfRatings: ratings, sjtCorrect: sjt, sjtTotal: SJT_ITEMS.length, confidence, knowledgeCorrect: know ?? 0, knowledgeTotal: KNOWLEDGE_ITEMS.length,
    ...(kind === 'baseline' ? { goals, goalNote: goalNote.trim() || undefined } : {}), ...(kind !== 'baseline' && explanation.trim() ? { explanation: explanation.trim() } : {}),
  }] }));
  return (<><h1>{KIND_LABEL[kind]} check</h1>
    <p className="muted small">Original, non-validated measures. Not a diagnosis. About 8 to 12 minutes. Stored only on this device.</p>
    {part === 1 && <section className="card">
      {kind === 'baseline' && <fieldset><legend><h2>Your goals</h2></legend><p className="small muted">Choose any that apply.</p>
        {GOALS.map(g => <label key={g} className="check"><input type="checkbox" checked={goals.includes(g)} onChange={e => setGoals(x => e.target.checked ? [...x, g] : x.filter(y => y !== g))} /> {g}</label>)}
        <label className="field">Anything else (optional)<textarea rows={2} value={goalNote} onChange={e => setGoalNote(e.target.value)} /></label></fieldset>}
      <h2>Self-ratings</h2>{SELF_RATING_ITEMS.map((q, i) => <fieldset key={i} className="rating"><legend>{q}</legend>
      <div className="chips">{SELF_RATING_SCALE.map((l, k) => <label key={k} className="chip"><input type="radio" name={`r${i}`} checked={ratings[i] === k} onChange={() => setRatings(r => r.map((v, j) => (j === i ? k : v)))} /> {l}</label>)}</div></fieldset>)}
      <label className="field">Overall, how confident are you in handling difficult emotions? {confidence}/10<input type="range" min={0} max={10} value={confidence} onChange={e => setConfidence(+e.target.value)} /></label>
      <button className="primary" disabled={ratings.includes(-1)} onClick={() => setPart(2)}>Continue</button></section>}
    {part === 2 && <Quiz label="Knowledge" items={KNOWLEDGE_ITEMS} onDone={r => { setKnow(Object.values(r).filter(Boolean).length); setPart(kind === 'baseline' ? 4 : 3); }} />}
    {part === 3 && <section className="card"><h2>Explain in your own words</h2><label htmlFor="ex">How would you now handle a moment of strong anger at work, step by step? (The app does not grade this; it is kept so you can compare later.)</label>
      <textarea id="ex" rows={5} value={explanation} onChange={e => setExplanation(e.target.value)} /><button className="primary" onClick={() => setPart(4)}>Continue</button></section>}
    {part === 4 && <Quiz label="Situations" items={SJT_ITEMS} onDone={r => { save(Object.values(r).filter(Boolean).length); setPart(5); }} />}
    {part === 5 && <div className="card"><h2>Saved</h2><button className="primary" onClick={() => go('#/progress')}>See progress</button></div>}
  </>);
}

export function Library({ id }: { id?: string }) {
  useEffect(() => { if (id) document.getElementById(id)?.scrollIntoView(); }, [id]);
  const usedBy = (cid: string) => [...SESSIONS.filter(s => s.claimIds.includes(cid)).map(s => s.title), ...SCENARIOS.filter(s => s.claimIds.includes(cid)).map(s => s.title)];
  return (<><h1>Research library</h1>
    <div className="card"><p>Each source below was checked against Crossref metadata (DOI, authors, year, title). The claim text is this app's plain-language summary at abstract level; it was not checked against full texts and gives no effect sizes. Most findings are from adults in research settings and may not transfer exactly to you.</p></div>
    {SOURCES.map(s => <section key={s.id} id={s.id} className="card"><h2 className="h3">{s.title}</h2>
      <p className="small">{s.authors} ({s.year}). <em>{s.venue}</em>. <a href={`https://doi.org/${s.doi}`} rel="noopener noreferrer">doi:{s.doi}</a> <span className="badge">DOI verified</span></p>
      {s.claims.map(c => <div key={c.id}><p>{c.text}</p><p className="small muted">Used in: {usedBy(c.id).slice(0, 6).join('; ') || 'not yet used'}</p></div>)}</section>)}
  </>);
}

export function Settings() {
  const { st, update, storage, persistent } = useApp();
  const [msg, setMsg] = useState('');
  const download = () => { const b = new Blob([exportData(st)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `emotional-skills-lab-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setMsg('Export downloaded.'); };
  return (<><h1>Settings and privacy</h1>
    {!persistent && <p className="card warn">Storage is unavailable in this browser mode. Your progress will be lost when you close the app.</p>}
    <section className="card"><h2>Theme</h2><div className="chips">{(['auto', 'light', 'dark'] as const).map(t => <button key={t} className="chip" aria-pressed={st.settings.theme === t} onClick={() => update(x => ({ ...x, settings: { ...x.settings, theme: t } }))}>{t === 'auto' ? 'Match phone' : t[0].toUpperCase() + t.slice(1)}</button>)}</div></section>
    <section className="card"><h2>Follow-up checks</h2><p>After the post-programme check, short follow-ups are offered at about 2 and 6 weeks. There are no notifications; they appear on Today.</p>
      <label className="check"><input type="checkbox" checked={st.settings.followups?.enabled ?? true} onChange={e => update(x => ({ ...x, settings: { ...x.settings, followups: { enabled: e.target.checked } } }))} /> Offer follow-up checks</label></section>
    <section className="card"><h2>Your data</h2><p>Everything is stored in this browser on this device (IndexedDB). Nothing is sent anywhere: there are no accounts, analytics or servers. Clearing browser data, uninstalling, or private mode can erase it, so export a backup now and then.</p>
      <div className="row-btns"><button onClick={download}>Export backup</button>
        <label className="btn">Import backup<input className="sr-only" type="file" accept="application/json" onChange={async e => {
          const f = e.target.files?.[0]; if (!f) return;
          try { const s = importData(await f.text()); if (confirm('Replace all current data with this backup?')) { update(() => s); setMsg('Import complete.'); } } catch (err) { setMsg(`Import failed: ${(err as Error).message}`); }
        }} /></label>
        <button className="danger" onClick={() => { if (confirm('Reset progress? Journal and assessments are kept.')) update(x => ({ ...emptyState(), journal: x.journal, assessments: x.assessments, settings: x.settings })); setMsg('Progress reset.'); }}>Reset progress</button>
        <button className="danger" onClick={async () => { if (confirm('Delete ALL data permanently from this device?')) { await deleteAll(storage); update(() => emptyState()); setMsg('All data deleted.'); } }}>Delete all data</button></div>
      <p role="status">{msg}</p></section>
    <section className="card"><h2>How progress works</h2><ul><li>Completion: sessions finished.</li><li>Mastery: a phase checkpoint scored at {MASTERY_THRESHOLD * 100}% or more. This threshold is a design choice, not a research standard.</li><li>Retention: correct answers on items reviewed {REVIEW_INTERVALS_DAYS.join(', ')} days after mastery. A wrong answer sends the item back to the first interval.</li></ul></section>
  </>);
}

export function Help() {
  return (<><h1>Safety and scope</h1><div className="card"><p>Emotional Skills Lab is self-guided skills training. It is not therapy, diagnosis or crisis support, and it has not been tested as a clinical intervention.</p>
    <p>If you feel unsafe or may harm yourself or someone else, contact emergency services now. In India dial <a href="tel:112">112</a>. If difficult emotions persist or affect daily life, consider speaking with a qualified mental-health professional.</p>
    <p>Content is informed by published research listed in the Library, simplified for practice. Individual results vary.</p></div></>);
}
