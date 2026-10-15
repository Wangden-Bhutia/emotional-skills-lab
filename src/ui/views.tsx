import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { useApp } from './store';
import { Quiz } from './Quiz';
import { SESSIONS } from '../content/sessions';
import { PHASES } from '../content/phases';
import { SCENARIOS, CATEGORY_LABELS } from '../content/scenarios';
import { SOURCES } from '../content/sources';
import { SELF_RATING_ITEMS, SELF_RATING_SCALE, SJT_ITEMS, KNOWLEDGE_ITEMS, GOALS, POST_KNOWLEDGE_ITEMS, POST_SJT_ITEMS } from '../content/measures';
import { COMPETENCIES, EVIDENCE_RULE } from '../content/competencies';
import type { ScenarioCategory, CheckItem } from '../content/types';
import { TRANSFER } from '../content/scenarios';
import { CHECKPOINT_DRAW } from '../content/enrich';
import { Activity } from './Activity';
import { ExplainBack } from './ExplainBack';
import {
  checkpointItems, lessonItems, retakeLesson, remediationFor, skillStatus, SKILL_SESSIONS, ITEM_SKILL, postponeFollowup, FOLLOWUP_DAYS,
  ALL_ITEMS, MASTERY_THRESHOLD, retentionItems, REVIEW_INTERVALS_DAYS, answerReview, completeSession, dueReviews, emotionFrequency,
  followupDue, isUnlocked, metrics, nextSession, phaseMastered, emptyState, currentStreak,
  type Assessment, type JournalEntry,
} from '../engine/state';
import { deleteAll, backupBeforeImport, readPreImportBackup } from '../storage/repo';
import { exportData, importData, mergeStates, summarise, DataError } from '../engine/data';
import { buildReminderIcs, type ReminderTime } from '../engine/ics';
import { EVIDENCE, USE_LABEL } from '../content/evidence';
import { SAFETY_NOTE } from '../content/safetyScenarios';
import type { AppState } from '../engine/state';
import type { TradeOff } from '../content/types';
import { InstallCard } from './install';
import { useConfirm } from './confirm';
import { SUPPORT } from '../content/support';
import { IconPlay, IconMasks, IconBookOpen, IconLightbulb, IconNotepad, IconLock, IconPencil, IconBook, IconSettings } from './icons';
const range = (r: readonly [number, number]) => `${r[0]} to ${r[1]} min`;

export const APP_VERSION = '1.3.0';
/** Scenarios that practise a session's skill (scenario.skill names the lesson title). */
export function scenariosFor(title: string) {
  const exact = SCENARIOS.filter(x => x.skill === title);
  if (exact.length) return exact;
  // No scenario names this lesson's skill: offer ones linked to other lessons in the same phase, else easy general ones.
  const phase = SESSIONS.find(s => s.title === title)?.phase;
  const near = SCENARIOS.filter(x => SESSIONS.some(s => s.phase === phase && s.title === x.skill));
  return (near.length ? near : SCENARIOS.filter(x => x.difficulty === 1 && !x.safety)).slice(0, 2);
}
/** One-shot prefill handed to Reflections by 'Save as reflection' buttons. */
type Draft = Partial<Pick<JournalEntry, 'trigger' | 'facts' | 'interpretation' | 'urge' | 'strategy' | 'next' | 'lesson' | 'note'>>;
let pendingDraft: Draft | null = null;
export const saveAsReflection = (d: Draft) => { pendingDraft = d; go('#/me/reflections'); };
/** Picks one scenario for Today: unseen ones linked to sessions in the current phase (or finished ones) first. */
export function pickScenario(st: AppState) {
  const tried = new Set(st.scenarios.map(a => a.scenarioId));
  const ns = nextSession(st); const phase = ns?.phase ?? PHASES.at(-1)!.id;
  const titles = new Set(SESSIONS.filter(s => s.phase === phase || st.completed[s.id]).map(s => s.title));
  const inPhase = SCENARIOS.filter(x => SESSIONS.some(s => s.phase === phase && s.title === x.skill));
  return inPhase.find(x => !tried.has(x.id)) ?? SCENARIOS.find(x => titles.has(x.skill) && !tried.has(x.id)) ?? SCENARIOS.find(x => !tried.has(x.id)) ?? SCENARIOS[0];
}
export const go = (h: string) => { location.hash = h; };
const pct = (x: number | null) => (x === null ? 'No data yet' : `${Math.round(x * 100)}%`);
const fmt = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const claimSource = (cid: string) => SOURCES.find(s => s.claims.some(c => c.id === cid));
const EMOTIONS = ['Anger', 'Irritation', 'Frustration', 'Anxiety', 'Fear', 'Sadness', 'Disappointment', 'Hurt', 'Shame', 'Guilt', 'Embarrassment', 'Resentment', 'Overwhelm', 'Calm', 'Content', 'Joy', 'Pride', 'Relief', 'Gratitude', 'Curiosity'];

/** Glanceable "where am I" strip: sessions done, week, streak, and a 9-dot phase path.
 * Sits above everything else on Today so progress is visible without digging into Me > Progress. */
function ProgressStrip({ st }: { st: AppState }) {
  const ns = nextSession(st);
  const curPhase = ns ? ns.phase : 9;
  const done = Object.keys(st.completed).length;
  const streak = currentStreak(st);
  return (<section className="card strip" aria-label="Your progress">
    <div className="strip-row">
      <div className="strip-stat"><strong>{done}<span className="small muted">/{SESSIONS.length}</span></strong><span className="small muted">sessions</span></div>
      <div className="strip-stat"><strong>{ns ? ns.week : 12}<span className="small muted">/12</span></strong><span className="small muted">week</span></div>
      <div className="strip-stat"><strong>{streak}</strong><span className="small muted">day streak{streak === 1 ? '' : 's'}</span></div>
    </div>
    <ol className="phase-path" aria-label="Phases">{PHASES.map(p => {
      const state = phaseMastered(st, p.id) ? 'mastered' : p.id < curPhase ? 'behind' : p.id === curPhase ? 'current' : 'upcoming';
      return <li key={p.id} className={state} title={`Phase ${p.id}: ${p.title}${state === 'mastered' ? ' (mastered)' : state === 'current' ? ' (in progress)' : ''}`}>
        <span aria-hidden>{state === 'mastered' ? '✓' : p.id}</span><span className="sr-only">Phase {p.id}: {p.title}, {state === 'mastered' ? 'mastered' : state === 'current' ? 'in progress' : state === 'behind' ? 'completed, not yet mastered' : 'not started'}</span>
      </li>;
    })}</ol>
  </section>);
}
/** Recap of the last thing you actually did, so "yesterday" means something concrete: its key points
 * and, if you wrote one, your own words from the explain-back step. */
function LastTime({ st, session }: { st: AppState; session?: typeof SESSIONS[number] }) {
  if (!session) return null;
  const expl = st.explanations?.[session.id]?.at(-1);
  return (<details className="card small" open>
    <summary>Last time: {session.title}</summary>
    <ul>{session.explain.keyPoints.map(k => <li key={k}>{k}</li>)}</ul>
    {expl?.text && <p className="quote small">In your own words: “{expl.text}”</p>}
  </details>);
}
export function Home() {
  const { st, update, notice, clearNotice } = useApp();
  const fu = followupDue(st);
  const ns = nextSession(st);
  const due = dueReviews(st).length;
  const baseline = st.assessments.some(a => a.kind === 'baseline');
  const phase = ns ? PHASES[ns.phase - 1] : undefined;
  const priorities = SKILL_SESSIONS.filter(s => skillStatus(st, s.id).status === 'needs practice').slice(0, 3);
  const prevIdx = ns ? SESSIONS.indexOf(ns) - 1 : -1;
  const prevSession = prevIdx >= 0 ? SESSIONS[prevIdx] : undefined;
  const why = ns && (ns.prerequisites.length ? `It builds on ${ns.prerequisites.map(p => SESSIONS.find(x => x.id === p)?.title).filter(Boolean).join(' and ')}.` : prevIdx < 0 ? 'It is the first session.' : `It follows ${SESSIONS[prevIdx].title}.`);
  const firstRun = !st.settings.welcomed && !baseline && !Object.keys(st.completed).length;
  return (<>
    <h1>Today</h1>
    {notice && <div className="card warn" role="alert"><h2>Your saved data could not be read</h2><p>{notice}</p><button onClick={clearNotice}>Dismiss</button></div>}
    {!firstRun && <ProgressStrip st={st} />}
    {ns ? <section className="card hero" aria-labelledby="next-h">
      <p className="kicker"><IconPlay className="ki" /> Next session · Phase {ns.phase}: {phase!.title}</p>
      <h2 id="next-h">{ns.title}</h2>
      <p className="small muted">Week {ns.week}, day {ns.day} · {ns.kind === 'checkpoint' ? 'checkpoint' : ns.kind} · {range(ns.range)}</p>
      <button className="primary wide" onClick={() => go(`#/session/${ns.id}`)}>Start session</button>
      {firstRun ? <p className="small hero-links">New here? <a href="#/welcome">Read the 2-minute introduction</a> or <a href="#/assess/baseline">take the optional baseline</a> first.</p>
        : !baseline ? <p className="small hero-links">Optional: <a href="#/assess/baseline">take the baseline</a> so you can compare later.</p> : null}
    </section>
      : <section className="card hero"><h2>Programme complete</h2><p>Keep skills fresh with reviews and the gym.</p>{!st.assessments.some(a => a.kind === 'post') && <button className="primary wide" onClick={() => go('#/assess/post')}>Take post-programme check</button>}</section>}
    {!firstRun && <LastTime st={st} session={prevSession} />}
    {due > 0 && <section className="card"><h2 className="h3">{due} review{due > 1 ? 's' : ''} due</h2><p className="small">A few minutes of recall keeps earlier skills fresh. Doing these before the next session is a good habit.</p><button onClick={() => go('#/review')}>Open reviews</button></section>}
    {fu && <section className="card"><h2 className="h3">Follow-up is due</h2><p className="small">A short check about {fu === 'followup2' ? 2 : 6} weeks after the programme. Optional.</p><div className="row-btns"><button onClick={() => go(`#/assess/${fu}`)}>Take follow-up</button><button onClick={() => update(x => postponeFollowup(x))}>Postpone a week</button></div></section>}
    <InstallCard />
    {ns && <details className="card flat small"><summary>Why this session next</summary><p>{why} {ns.objective}</p></details>}
    {priorities.length > 0 && <section className="card"><h2 className="h3">Worth revisiting</h2><ul>{priorities.map(p => <li key={p.id}><a href={`#/session/${p.id}`}>{p.title}</a>: latest delayed answers were below the mastery threshold.</li>)}</ul></section>}
    {ns && (() => { const sc = pickScenario(st); return <section className="card" aria-labelledby="prac-h"><p className="kicker"><IconMasks className="ki" /> Practise a scenario</p><h2 id="prac-h" className="h3">{sc.title}</h2><p className="small muted">Skill: {sc.skill} · {sc.context}</p><div className="row-btns"><button onClick={() => go(`#/scenarios/${sc.id}`)}>Practise this scenario</button><a className="pad" href="#/scenarios">All scenarios</a></div></section>; })()}
    <p className="muted small">This is skills training, not therapy or crisis care. In an emergency in India, dial 112. <a className="pad" href="#/help">Safety and support</a></p>
  </>);
}

export function OfflineNote() {
  const [ctl, setCtl] = useState(() => typeof navigator !== 'undefined' && !!navigator.serviceWorker?.controller);
  useEffect(() => { const sw = navigator.serviceWorker; if (!sw) return; const f = () => setCtl(!!sw.controller); sw.addEventListener('controllerchange', f); return () => sw.removeEventListener('controllerchange', f); }, []);
  return <p className="small" role="status" data-offline-ready={ctl ? 'yes' : 'no'}>{ctl
    ? 'Offline ready: this app is saved on this device and works without a connection, including export and import.'
    : 'First visit: the app is still downloading for offline use. Keep a connection until this message changes; after that it works offline.'}</p>;
}

export function Welcome() {
  const { update } = useApp();
  return (<><h1>Welcome to Emotional Skills Lab</h1>
    <section className="card"><h2>What it is</h2><p>A private training programme for noticing, understanding and choosing how to respond to everyday emotions, criticism, conflict and pressure. You learn a skill, practise it, show it in short checks, and review it later.</p></section>
    <section className="card"><h2>What it can and cannot do</h2><ul><li>It can teach and let you practise skills drawn from published research on emotion regulation and learning.</li><li>It cannot diagnose, treat or replace professional care, and it has not been tested as an intervention. No app, including this one, works the same for everyone.</li><li>It never reads or grades your writing. Scores come only from multiple-choice and scenario answers, using fixed rules you can see.</li></ul></section>
    <section className="card"><h2>The pathway</h2><p>12 weeks, 9 phases, {SESSIONS.length} sessions of about {Math.min(...SESSIONS.map(x => x.range[0]))} to {Math.max(...SESSIONS.map(x => x.range[1]))} minutes each, five a week. Each session shows its own range: the low end is a quick reader who skips the optional writing, the high end a slower reader who writes the explanation (method in the repository docs; not yet timed with real learners). Going slower is fine; nothing expires and nothing is penalised.</p></section>
    <section className="card"><h2>Training, assessment and care are different</h2><p>Lessons and the gym are training. Checkpoints, reviews and the baseline are assessment of what you can show in this app. Neither is clinical care. If you are struggling, a qualified professional is the right support.</p></section>
    <section className="card"><h2>Offline use</h2><OfflineNote /></section>
    <section className="card"><h2>Your data</h2><p>Everything stays in this browser on this device. It is not encrypted and nothing is sent anywhere. Clearing browser data or private browsing can erase it, and anyone using this device could open it. Export a backup from Settings now and then.</p></section>
    <div className="row-btns"><button className="primary" onClick={() => { update(x => ({ ...x, settings: { ...x.settings, welcomed: true } })); go('#/assess/baseline'); }}>Set goals and take the baseline</button>
      <button onClick={() => { update(x => ({ ...x, settings: { ...x.settings, welcomed: true } })); go('#/'); }}>Go to Today</button></div>
    <p className="small muted">You can reopen this page any time from Settings.</p>
  </>);
}

export function Programme() {
  const { st } = useApp();
  return (<><h1>Programme</h1><p className="muted">12 weeks, 9 phases, {SESSIONS.length} sessions. Sessions unlock in order; completed ones stay open to revisit without changing your place. Each lesson ends with scenarios that practise it.</p>
    <p><a href="#/scenarios">All scenarios ({SCENARIOS.length})</a> · <a href="#/review">Reviews</a></p>
    {nextSession(st) && <p className="card small">Next: <a href={`#/session/${nextSession(st)!.id}`}>{nextSession(st)!.title}</a>, because sessions build on the one before. Each row shows completion and, for skills, mastery status.</p>}
    {PHASES.map(p => (
      <section key={p.id} className={`card phase${p.id}`}>
        <h2><span className="phase-dot" aria-hidden /> Phase {p.id}: {p.title} {phaseMastered(st, p.id) && <span className="badge">Mastered</span>}</h2>
        <p className="muted">{p.goal} {p.weeks.length > 1 ? `Weeks ${p.weeks.join(' and ')}` : `Week ${p.weeks[0]}`}.</p>
        <ul className="list">{SESSIONS.filter(s => s.phase === p.id).map(s => {
          const done = !!st.completed[s.id], open = isUnlocked(st, s.id);
          const cpOpen = done && s.kind === 'checkpoint' && !phaseMastered(st, s.phase);
          return <li key={s.id}><button disabled={!open} onClick={() => go(`#/session/${s.id}`)} className="row">
            {open || done ? <span aria-hidden>{cpOpen ? '◐' : done ? '✓' : '○'}</span> : <IconLock className="row-icon" />}<span>Week {s.week} · Day {s.day} · {s.title}<span className="sr-only">{cpOpen ? ', attempted, not yet mastered' : done ? ', completed' : open ? ', available' : ', locked'}</span></span><span className="muted small">{s.kind}{cpOpen ? ' · not yet mastered' : done && s.kind === 'checkpoint' ? ' · mastered' : done && (s.kind === 'lesson' || s.kind === 'practice') ? ` · ${skillStatus(st, s.id).status}` : ''}</span></button></li>;
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

const STEPS = ['Learn', 'Try', 'Explain', 'Check'] as const;
/** Session step bar: text + symbol + aria-current, so state is never conveyed by colour alone. */
function StepBar({ current, done, skip }: { current: number; done: boolean[]; skip?: number }) {
  return <ol className="steps" aria-label="Session steps">{STEPS.map((t, i) => {
    const state = i === skip ? 'na' : i === current ? 'current' : done[i] ? 'done' : 'todo';
    return <li key={t} className={state} aria-current={i === current ? 'step' : undefined}>
      <span className="mark" aria-hidden>{state === 'done' ? '✓' : state === 'na' ? '–' : i + 1}</span>{t}<span className="sr-only">{state === 'done' ? ', done' : state === 'current' ? ', current step' : state === 'na' ? ', not part of this session' : ', not started'}</span></li>;
  })}</ol>;
}
const Kicker = ({ icon: Icon, children }: { icon: ComponentType<{ className?: string }>; children: string }) => <p className="kicker"><Icon className="ki" /> {children}</p>;

export function SessionView({ id }: { id: string }) {
  const { st, update } = useApp();
  const s = SESSIONS.find(x => x.id === id);
  const resumed = st.inProgress?.[id];
  const [stage, setStageRaw] = useState<'learn' | 'explain' | 'check' | 'done'>(resumed ? 'explain' : 'learn');
  const setStage = (x: 'learn' | 'explain' | 'check' | 'done') => { setStageRaw(x); window.scrollTo(0, 0); update(y => { const ip = { ...y.inProgress }; if (x === 'explain' || x === 'check') ip[id] = { stage: x, at: Date.now() }; else delete ip[id]; return { ...y, inProgress: ip }; }); };
  const [reflect, setReflect] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [missed, setMissed] = useState<string[]>([]);
  const [actDone, setActDone] = useState(!!resumed);
  const [items, setItems] = useState<CheckItem[]>([]);
  if (!s) return <p>Session not found.</p>;
  if (!isUnlocked(st, s.id)) return <div className="card"><h1>Locked</h1><p>Finish the previous session first.</p><button onClick={() => go('#/programme')}>Programme</button></div>;
  const prev = st.completed[s.id];
  const assess = s.kind === 'checkpoint' || s.kind === 'review';
  const isCp = s.kind === 'checkpoint';
  const mastered = isCp && phaseMastered(st, s.phase);
  const startCheck = () => { setItems(assess ? checkpointItems(st, s.id, CHECKPOINT_DRAW) : lessonItems(st, s.id)); setStage('check'); };
  const prereq = s.prerequisites.map(p => SESSIONS.find(x => x.id === p)!).filter(Boolean);
  const est = s.estimate;
  const current = stage === 'learn' ? 0 : stage === 'explain' ? 2 : 3;
  const done = [stage !== 'learn' || actDone, actDone || stage !== 'learn', stage === 'check' || stage === 'done', stage === 'done'];
  const passed = score !== null && score >= MASTERY_THRESHOLD;
  const status = prev && (isCp ? (mastered ? 'Mastered' : `Attempted ${fmt(prev.at)} · not yet mastered`) : `Completed ${fmt(prev.at)}`);
  const finish = () => {
    if (reflect.trim() && st.settings.journalPrompts !== false) update(x => ({ ...x, journal: [{ id: crypto.randomUUID(), at: Date.now(), type: 'reflection', emotions: [], note: `${s.title}: ${reflect.trim()}` }, ...x.journal] }));
    go('#/');
  };
  const resultTitle = !assess ? 'Lesson complete' : !isCp ? 'Review finished' : passed ? 'Checkpoint passed' : 'Checkpoint not passed yet';
  return (<article>
    <p className="muted small">Week {s.week}, day {s.day} · Phase {s.phase}: {PHASES[s.phase - 1].title} · {range(s.range)}</p>
    <h1>{s.title}</h1><p className="lead">Goal: {s.objective}</p>
    {status && stage !== 'done' && <p className={'badge' + (isCp && !mastered ? ' pending' : '')}>{status}</p>}
    <StepBar current={current} done={done} skip={s.activity ? undefined : 1} />
    {resumed && stage === 'explain' && <p className="card small" role="status">Resumed where you left off. <button className="link" onClick={() => setStage('learn')}>Back to the lesson</button></p>}
    {stage === 'learn' && <>
      <details className="card small aux"><summary>Before you start: competency, prerequisites and time</summary>
        {COMPETENCIES[s.id] && <p><strong>Competency:</strong> {COMPETENCIES[s.id]} <span className="muted">{EVIDENCE_RULE}</span></p>}
        {prereq.length ? <><p>Builds on:</p><ul className="small">{prereq.map(p => <li key={p.id}><a href={`#/session/${p.id}`}>{p.title}</a>: {p.explain.keyPoints[0]}</li>)}</ul></> : <p>No prerequisites.</p>}
        <p className="muted">Time: {range(s.range)}. Reading about {est.words} words, {est.interactions} activity choices, {est.quizItems} questions{s.kind === 'checkpoint' ? '' : ', optional written explanation'}. Low end: faster reading, explanation skipped; high end: slower reading, explanation written. Derived from a measured walk-through of the content, not timed with real learners.</p></details>
      <section className="block learn" aria-label="Learn"><Kicker icon={IconBookOpen}>Learn</Kicker>{s.teach.map((p, i) => <p key={i}>{p}</p>)}
        <p className="small muted">Evidence: {s.claimIds.map(c => { const src = claimSource(c); return src ? <a key={c} href={`#/library/${src.id}`}>{src.authors.split(',')[0]} ({src.year}) </a> : null; })}</p></section>
      {s.example && <section className="block example" aria-label="Worked example"><Kicker icon={IconLightbulb}>Worked example</Kicker><p>{s.example}</p></section>}
      {s.activity && <div className="block try"><Activity a={s.activity} onDone={(c, t) => { setActDone(true); update(x => ({ ...x, activities: { ...x.activities, [s.id]: { at: Date.now(), correct: c, total: t } } })); }} /></div>}
      <section className="block practice" aria-label="Practice exercise"><Kicker icon={IconNotepad}>Practice in your day</Kicker><ol>{s.practice.map((p, i) => <li key={i}>{p}</li>)}</ol></section>
      {s.id === 'w03d4' && <Breather />}
      <button className="primary wide" disabled={!!s.activity && !actDone} onClick={() => setStage('explain')}>{s.activity && !actDone ? 'Complete the activity to continue' : 'Next: explain it back'}</button>
    </>}
    {stage === 'explain' && <div className="block explain"><ExplainBack e={s.explain} initial={st.explanations?.[s.id]?.at(-1)?.text}
      onSkip={startCheck}
      onSave={(text, self, revised) => { update(x => ({ ...x, explanations: { ...x.explanations, [s.id]: [...(x.explanations?.[s.id] ?? []), { at: Date.now(), text, self, revised }] } })); startCheck(); }} /></div>}
    {stage === 'check' && <div className="block check"><Quiz key={items.map(i => i.id).join()} label={assess ? 'Checkpoint' : 'Knowledge check'} items={items} onDone={r => {
      const v = Object.values(r); setScore(v.filter(Boolean).length / v.length); setMissed(remediationFor(r)); setStage('done');
      update(x => prev && !assess ? retakeLesson(x, s.id, r) : completeSession(x, s.id, r));
    }} /></div>}
    {stage === 'done' && <>
      <section className={'card result ' + (isCp ? (passed ? 'pass' : 'notyet') : 'done')} aria-labelledby="result-h">
        <p className="kicker"><span aria-hidden>{isCp ? (passed ? '✓' : '↻') : '✓'}</span> {isCp ? 'Checkpoint result' : 'Result'}</p>
        <h2 id="result-h">{resultTitle}</h2>
        <p>Score: {pct(score)}{isCp ? ` (mastery needs ${MASTERY_THRESHOLD * 100}%).` : '.'} {isCp ? (passed ? 'Phase mastered. Its items will return as spaced reviews.' : 'Your attempt is saved and the next session is open, but this phase is not mastered yet. Revisit the lessons below, then retake: a retake uses different questions where available.')
          : assess ? '' : 'Finishing a lesson records completion only; mastery is shown later in checkpoints and reviews.'}</p>
        {isCp && !passed && <div className="row-btns"><button className="primary" onClick={startCheck}>Retake checkpoint</button></div>}
        {missed.length > 0 && <div className="feedback"><h3>Revisit before retaking</h3><p className="small">Questions you missed come from these skills:</p>
          <ul>{missed.map(m => { const x = SESSIONS.find(y => y.id === m)!; return <li key={m}><a href={`#/session/${m}`}>{x.title}</a>: {x.objective}</li>; })}</ul></div>}
        <h3>Summary: key points</h3><ul>{s.explain.keyPoints.map(k => <li key={k}>{k}</li>)}</ul>
        <h3>Application task</h3><p>{s.apply}</p>
        <p className="small muted">Sources: {s.claimIds.map(c => { const src = claimSource(c); return src ? <a key={c} href={`#/library/${src.id}`}>{src.authors.split(',')[0]} ({src.year}) </a> : null; })}</p>
        {scenariosFor(s.title).length > 0 && <section className="practise" aria-labelledby="pt-h"><h3 id="pt-h">Practise this</h3><p className="small muted">Scenarios that use this skill in a realistic situation.</p><ul className="list">{scenariosFor(s.title).map(x => <li key={x.id}><a href={`#/scenarios/${x.id}`}>{x.title}</a>{st.scenarios.some(a => a.scenarioId === x.id) ? ' ✓' : ''}</li>)}</ul></section>}
        <label htmlFor="refl">Optional reflection: {s.reflect}</label>
        <textarea id="refl" value={reflect} onChange={e => setReflect(e.target.value)} rows={3} />
        <div className="row-btns">
          {isCp && !passed ? <button onClick={finish}>Continue without retaking</button> : <button className="primary" onClick={finish}>Save and continue</button>}
          <button onClick={() => { const t = reflect.trim(); saveAsReflection({ trigger: `Lesson: ${s.title}`, strategy: s.apply, lesson: t || undefined }); }}>Save as reflection</button>
          {!assess && <button onClick={startCheck}>Retake with different questions</button>}</div>
      </section></>}
  </article>);
}

const DIFF = ['', 'Easier', 'Moderate', 'Harder'];
/** Safety scenarios use neutral labels: no verdict that blames someone for complying or staying quiet under threat. */
const SAFETY_Q = ['Higher risk to you', 'Understandable; leaves some risk with you', 'Safety-first choice'];
export function Gym() {
  const { st } = useApp();
  const [cat, setCat] = useState(''); const [skill, setSkill] = useState(''); const [diff, setDiff] = useState(''); const [ctx, setCtx] = useState('');
  const cats = Object.keys(CATEGORY_LABELS) as ScenarioCategory[];
  const skills = [...new Set(SCENARIOS.map(s => s.skill))].sort();
  const tried = new Set(st.scenarios.map(a => a.scenarioId));
  const last = new Map(st.scenarios.map(a => [a.scenarioId, a]));
  const revisit = SCENARIOS.filter(s => last.get(s.id)?.quality === 0).slice(0, 5);
  const list = SCENARIOS.filter(s => (!cat || s.category === cat) && (!skill || s.skill === skill) && (!diff || s.difficulty === +diff) && (!ctx || s.context === ctx));
  return (<><h1>Scenario library</h1><p className="muted">Practise the full chain: facts, emotions, response, and sometimes a follow-up decision. {tried.size} of {SCENARIOS.length} tried.</p>
    <section className="card filters" aria-label="Filters">
      <label className="field">Situation<select value={cat} onChange={e => setCat(e.target.value)}><option value="">All</option>{cats.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}</select></label>
      <label className="field">Skill<select value={skill} onChange={e => setSkill(e.target.value)}><option value="">All</option>{skills.map(c => <option key={c}>{c}</option>)}</select></label>
      <label className="field">Difficulty<select value={diff} onChange={e => setDiff(e.target.value)}><option value="">All</option>{[1, 2, 3].map(d => <option key={d} value={d}>{DIFF[d]}</option>)}</select></label>
      <label className="field">Context<select value={ctx} onChange={e => setCtx(e.target.value)}><option value="">All</option><option value="everyday">Everyday</option><option value="professional">Professional</option></select></label>
    </section>
    <p role="status" className="small muted">{list.length} scenarios shown.</p>
    {revisit.length > 0 && <section className="card"><h2>Worth another try</h2><p className="small muted">Scenarios where your last choice had clear downsides. Retrying is ordinary practice.</p><ul className="list">{revisit.map(s => <li key={s.id}><a href={`#/gym/${s.id}`}>{s.title}</a></li>)}</ul></section>}
    {cats.filter(c => list.some(s => s.category === c)).map(c => <section key={c} className="card"><h2>{CATEGORY_LABELS[c]}</h2><ul className="list">
      {list.filter(s => s.category === c).map(s => <li key={s.id}><button className="row" onClick={() => go(`#/gym/${s.id}`)}>
        <span aria-hidden>{tried.has(s.id) ? '✓' : '○'}</span><span>{s.title}{s.followUp ? ' · branching' : ''}{s.safety ? ' · safety' : ''}</span><span className="muted small">{s.context} · {DIFF[s.difficulty]}</span></button></li>)}
    </ul></section>)}</>);
}

function TradeOffLines({ t }: { t?: TradeOff }) {
  return t ? <dl className="tradeoff small"><div><dt>Protects</dt><dd>{t.protects}</dd></div><div><dt>Costs</dt><dd>{t.costs}</dd></div><div><dt>Fits when</dt><dd>{t.fits}</dd></div></dl> : null;
}
export function ScenarioView({ id }: { id: string }) {
  const { st, update } = useApp();
  const [attemptAt] = useState(() => Date.now());
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
  const Q = s.safety ? SAFETY_Q : ['Likely to backfire', 'Partly effective', 'Skilful'];
  const triedIds = new Set(st.scenarios.map(a => a.scenarioId));
  const similar = SCENARIOS.filter(x => x.id !== s.id && (x.category === s.category || x.skill === s.skill)).sort((a, b) => Number(triedIds.has(a.id)) - Number(triedIds.has(b.id))).slice(0, 2);
  return (<article>
    <p className="muted">{CATEGORY_LABELS[s.category]} · {s.context} · {DIFF[s.difficulty]} · skill: {s.skill}</p>
    <h1>{s.title}</h1>{s.safety && <div className="card safety" role="note"><h2 className="h3">Safety first</h2><p>{SAFETY_NOTE}</p>{s.support && <p className="small">{s.support} <a href="#/help">Where to get help</a></p>}</div>}<div className="card"><p className="lead">{s.situation}</p></div>
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
        update(x => ({ ...x, scenarios: [...x.scenarios, { scenarioId: s.id, at: attemptAt, emotions: emo, response: i, quality: r.quality, factsOk }] }));
      }}>{r.text}</button>)}</div></section>}
    {step >= 5 && resp !== null && <section className="card" role="status"><h2>Feedback and trade-offs</h2>
      {s.responses.map((r, i) => <div key={i} className={'fb q' + r.quality + (s.safety ? ' safe' : '') + (i === resp ? ' chosen' : '')}>
        <p><strong>{i === resp ? 'Your choice: ' : ''}{Q[r.quality]}</strong> · {r.text}</p><p className="small">{r.feedback}</p><TradeOffLines t={r.tradeoff} /></div>)}
      <p className="small muted">Ratings reflect this programme's teaching, not a validated scoring key. Context can change what works.</p>
      {step === 5 && <button className="primary" onClick={() => setStep(s.followUp ? 6 : 7)}>{s.followUp ? 'What happens next' : 'Next: reflect'}</button>}</section>}
    {step >= 6 && s.followUp && <section className="card"><h2>4. What happens next</h2><p className="lead">{s.followUp.next[resp!]}</p><h3>{s.followUp.prompt}</h3>
      <div className="opts">{s.followUp.options.map((o, i) => <div key={i}><button className={'opt' + (resp2 === i ? ' chosen' : '')} disabled={resp2 !== null} onClick={() => { setResp2(i); update(x => ({ ...x, scenarios: x.scenarios.map(a => a.scenarioId === s.id && a.at === attemptAt ? { ...a, followUp: i, followUpQuality: o.quality } : a) })); }}>{o.text}</button>
        {resp2 !== null && <div className={'fb q' + o.quality + (s.safety ? ' safe' : '')}><p className="small"><strong>{resp2 === i ? 'Your choice: ' : ''}{Q[o.quality]}.</strong> {o.feedback}</p><TradeOffLines t={o.tradeoff} /></div>}</div>)}</div>
      {resp2 !== null && <p className="small muted">Other people's responses are not under your control; the same choice can turn out differently on another day.</p>}
      {resp2 !== null && step === 6 && <button className="primary" onClick={() => setStep(7)}>Next: reflect</button>}</section>}
    {step >= 7 && <section className="card"><h2>Reflect and transfer</h2><label htmlFor="tr">{TRANSFER[s.category]}</label>
      <textarea id="tr" rows={3} value={transfer} onChange={e => setTransfer(e.target.value)} />
      <div className="row-btns"><button className="primary" onClick={() => {
        if (transfer.trim() && st.settings.journalPrompts !== false) update(x => ({ ...x, journal: [{ id: crypto.randomUUID(), at: Date.now(), type: 'reflection', emotions: [], note: `Gym, ${s.title}: ${transfer.trim()}` }, ...x.journal] }));
        go('#/scenarios');
      }}>{transfer.trim() && st.settings.journalPrompts !== false ? 'Save to journal and finish' : 'Finish'}</button></div>
      <button onClick={() => saveAsReflection({ trigger: `Scenario: ${s.title}`, facts: s.facts.join(' '), strategy: resp !== null ? s.responses[resp].text : undefined, lesson: transfer.trim() || undefined })}>Save as reflection</button>
      {similar.length > 0 && <><h3>Try a similar scenario</h3><ul className="list">{similar.map(x => <li key={x.id}><a href={`#/gym/${x.id}`}>{x.title}</a></li>)}</ul></>}</section>}
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
  const [ask, dialog] = useConfirm();
  const [mode, setMode] = useState<'checkin' | 'reflection' | 'plan' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [sel, setSel] = useState<Record<string, number>>({});
  const [f, setF] = useState<Record<string, string>>({});
  useEffect(() => { if (pendingDraft) { const d = pendingDraft; pendingDraft = null; setMode('reflection'); setF(Object.fromEntries(Object.entries(d).filter(([, v]) => v)) as Record<string, string>); } }, []);
  const reset = () => { setMode(null); setEditId(null); setSel({}); setF({}); };
  const save = () => {
    const base = editId ? st.journal.find(y => y.id === editId) : undefined;
    const e: JournalEntry = { id: editId ?? crypto.randomUUID(), at: base?.at ?? Date.now(), type: mode!, emotions: Object.entries(sel).map(([name, intensity]) => ({ name, intensity })), ...f, ...(editId ? { editedAt: Date.now() } : {}) };
    update(x => ({ ...x, journal: editId ? x.journal.map(y => y.id === editId ? e : y) : [e, ...x.journal] })); reset();
  };
  const edit = (e: JournalEntry) => {
    setEditId(e.id); setMode(e.type); setSel(Object.fromEntries(e.emotions.map(x => [x.name, x.intensity])));
    const { trigger, facts, interpretation, urge, strategy, outcome, next, lesson, note } = e;
    setF(Object.fromEntries(Object.entries({ trigger, facts, interpretation, urge, strategy, outcome, next, lesson, note }).filter(([, v]) => v !== undefined)) as Record<string, string>);
    window.scrollTo(0, 0);
  };
  const fld = (k: keyof JournalEntry, label: string) => <label key={k} className="field">{label}<textarea rows={2} value={f[k] ?? ''} onChange={e => setF(x => ({ ...x, [k]: e.target.value }))} /></label>;
  return (<><h1>Reflections</h1><p className="muted">Your journal: short by design, stored only on this device. <a href="#/me">Back to Me</a></p>
    {!mode && <div className="row-btns"><button className="primary" onClick={() => setMode('checkin')}>Quick check-in</button><button onClick={() => setMode('reflection')}>Full reflection</button><button onClick={() => setMode('plan')}>If-then plan</button></div>}
    {mode && <section className="card"><h2>{editId ? 'Edit entry' : { checkin: 'Quick check-in', reflection: 'Reflection', plan: 'If-then plan' }[mode]}</h2>
      {mode !== 'plan' && <fieldset><legend>Emotions (up to 3), tap to add</legend><div className="chips">
        {EMOTIONS.map(e => <button key={e} aria-pressed={e in sel} className="chip" onClick={() => setSel(x => { const n = { ...x }; if (e in n) delete n[e]; else if (Object.keys(n).length < 3) n[e] = 5; return n; })}>{e}</button>)}</div>
        {Object.entries(sel).map(([e, v]) => <label key={e} className="field">{e} intensity: {v}<input type="range" min={0} max={10} value={v} onChange={ev => setSel(x => ({ ...x, [e]: +ev.target.value }))} /></label>)}</fieldset>}
      {mode === 'checkin' && fld('note', 'One line (optional)')}
      {mode === 'reflection' && <><p className="small muted">Every field is optional. Fill in only what helps.</p>{[fld('trigger', 'What happened'), fld('facts', 'What I noticed'), fld('interpretation', 'My interpretation'), fld('urge', 'Emotion or impulse'), fld('strategy', 'What I did'), fld('next', 'What happened next?'), ...(f.outcome !== undefined ? [fld('outcome', 'Outcome')] : []), fld('lesson', 'What I will try next time'), ...(f.note !== undefined ? [fld('note', 'Note')] : [])]}</>}
      {mode === 'plan' && [fld('trigger', 'If (situation or cue)'), fld('strategy', 'Then I will')]}
      <div className="row-btns"><button className="primary" onClick={save}>{editId ? 'Save changes' : 'Save'}</button><button onClick={reset}>Cancel</button></div></section>}
    <ul className="list">{st.journal.map(e => <li key={e.id} className="card entry"><p className="muted small">{fmt(e.at)} · {e.type}{e.editedAt ? ` · edited ${fmt(e.editedAt)}` : ''}</p>
      {e.emotions.length > 0 && <p>{e.emotions.map(x => `${x.name} ${x.intensity}`).join(', ')}</p>}
      {e.type === 'plan' ? <p>If {e.trigger}, then {e.strategy}.</p> : [e.trigger, e.facts, e.interpretation, e.urge, e.strategy, e.next, e.outcome, e.lesson, e.note].filter(Boolean).map((t, i) => <p key={i}>{t}</p>)}
      <div className="row-btns"><button className="link" onClick={() => edit(e)}>Edit entry</button>
        <button className="link" onClick={async () => { if (await ask({ title: 'Delete this journal entry?', body: <p>The entry from {fmt(e.at)} is removed from this device. This cannot be undone unless you have an exported backup.</p>, confirm: 'Delete entry', danger: true })) update(x => ({ ...x, journal: x.journal.filter(y => y.id !== e.id) })); }}>Delete entry</button></div></li>)}</ul>
    {dialog}
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
  const due = dueReviews(st).length;
  const cps = SESSIONS.filter(s => s.kind === 'checkpoint');
  const needsPractice = SKILL_SESSIONS.filter(s => skillStatus(st, s.id).status === 'needs practice');
  return (<><h1>Progress</h1>
    <p className="small muted">Demonstrated performance (what you showed in checks and scenarios) is kept apart from self-report (how you rated yourself). Neither is compared with other people, and there are no norms.</p>
    <details className="card small"><summary>How scoring works</summary><ul className="small"><li>Lesson checks: completion only. Finishing a lesson does not mean mastery.</li><li>Checkpoints: rule-scored items from the phase plus two from earlier phases. {MASTERY_THRESHOLD * 100}% or more marks the phase mastered (a design choice, not a validated cutoff). Retakes draw different items.</li><li>Skill mastery: your latest delayed answers (checkpoints and reviews) on at least 2 items of a skill.</li><li>Explain-it-back: you compare your own words with a rubric. The app does not grade it.</li><li>Reviews: items return after {REVIEW_INTERVALS_DAYS.join(', ')} days. A miss sends the item back to the first interval.</li></ul></details>
    <section className="card"><h2>Demonstrated performance</h2>
      <dl className="metrics"><div><dt>Completion</dt><dd>{pct(m.completion)}</dd><dd className="small muted">Sessions finished. Does not mean mastered.</dd></div>
        <div><dt>Phase mastery</dt><dd>{m.masteredPhases} of 9 phases</dd><dd className="small muted">Checkpoint score of {MASTERY_THRESHOLD * 100}% or more (design choice).</dd></div>
        <div><dt>Skill mastery</dt><dd>{m.masteredSkills} of {SKILL_SESSIONS.length} skills</dd><dd className="small muted">Latest checkpoint and review answers per skill.</dd></div>
        <div><dt>Retention</dt><dd>{pct(m.retention)}</dd><dd className="small muted">Correct on delayed reviews ({m.reviewsDone} answered).</dd></div>
        <div><dt>Scenario quality</dt><dd>{pct(m.scenarioQuality)}</dd><dd className="small muted">Average rating of gym responses.</dd></div></dl></section>
    <section className="card"><h2>Phase checkpoints (cumulative)</h2><ul className="list">{cps.map(c => { const r = st.phaseResults[c.phase] ?? []; return <li key={c.id}><a href={`#/session/${c.id}`}>Phase {c.phase}: {PHASES[c.phase - 1].title}</a> <span className="badge">{phaseMastered(st, c.phase) ? 'Mastered' : r.length ? `${r.length} attempt${r.length > 1 ? 's' : ''}, retake available` : isUnlocked(st, c.id) ? 'Available' : 'Locked'}</span></li>; })}</ul></section>
    <section className="card"><h2>Scenario practice by situation type</h2><table><thead><tr><th>Situation</th><th>Attempts</th><th>Average rating</th></tr></thead><tbody>
      {(Object.keys(CATEGORY_LABELS) as ScenarioCategory[]).map(c => { const a = st.scenarios.filter(x => SCENARIOS.find(y => y.id === x.scenarioId)?.category === c);
        return <tr key={c}><td>{CATEGORY_LABELS[c]}</td><td>{a.length}</td><td>{a.length ? pct(a.reduce((t, x) => t + x.quality, 0) / (2 * a.length)) : '-'}</td></tr>; })}</tbody></table>
      <p className="small muted">Ratings follow this programme's teaching, not a validated key.</p></section>
    <section className="card"><h2>Reviews</h2><p className="small">{due} review item{due === 1 ? '' : 's'} due now.{due > 0 && <> <button onClick={() => go('#/review')}>Open reviews</button></>}</p>
      {(() => { const h = Object.entries(st.items).flatMap(([id, it]) => it.reviews.map(r => ({ id, ...r }))).sort((a, b) => b.at - a.at).slice(0, 10);
      return h.length ? <ul className="small">{h.map((r, i) => <li key={i}>{fmt(r.at)}: {SESSIONS.find(x => x.id === ITEM_SKILL[r.id])?.title ?? r.id}, {r.correct ? 'recalled' : 'missed, back to first interval'}</li>)}</ul> : <p className="small">No reviews answered yet.</p>; })()}</section>
    <section className="card"><h2>Skills</h2><p className="small muted">A skill is mastered when your latest answers on at least 2 of its items in checkpoints or reviews are {MASTERY_THRESHOLD * 100}% correct. "Needs practice" links back to the lesson.</p>
      <h3 className="h3">Needs practice</h3>{needsPractice.length ? needsPractice.map(s => <p key={s.id}><a href={`#/session/${s.id}`}>{s.title}</a></p>) : <p className="small">Nothing flagged. Missed checkpoint questions link back to the lesson that teaches them.</p>}
      <details><summary>Show all {SKILL_SESSIONS.length} skills</summary><ul className="list">{SKILL_SESSIONS.map(s => { const k = skillStatus(st, s.id);
        return <li key={s.id}>{k.status === 'needs practice' ? <a href={`#/session/${s.id}`}>{s.title}</a> : s.title}: <span className="badge">{k.status}</span>{k.score !== null && <span className="small muted"> {pct(k.score)} of {k.answered}</span>}<p className="small muted competency">{COMPETENCIES[s.id]}</p></li>; })}</ul><p className="small muted">{EVIDENCE_RULE}</p></details></section>
    <section className="card"><h2>Self-report and check results: baseline, post and follow-ups</h2>
      <p className="small muted">Original, non-validated items written for this app. Each result is kept separately and never merged. Use them for personal reflection only; changes may reflect many factors.</p>
      <table><thead><tr><th></th><th>Self-rating (1 to 5)</th><th>Confidence</th><th>Knowledge</th><th>Situations</th><th>Retention</th></tr></thead><tbody>
        {(['baseline', 'post', 'followup2', 'followup6'] as const).map(k => { const a = A(k); return <tr key={k}><td>{KIND_LABEL[k]}</td><td>{avg(a)}</td><td>{a?.confidence !== undefined ? `${a.confidence}/10` : '-'}</td><td>{a?.knowledgeTotal ? `${a.knowledgeCorrect}/${a.knowledgeTotal}` : '-'}</td><td>{a ? `${a.sjtCorrect}/${a.sjtTotal}` : '-'}</td><td>{a?.retentionTotal ? `${a.retentionCorrect}/${a.retentionTotal}` : '-'}</td></tr>; })}</tbody></table>
      <p className="small muted">Baseline uses one item set; the post check uses a different, unseen set covering the same skills, so the two are comparable in content but not identical.</p>
      {A('baseline')?.recurring ? <p className="small">Situations you noted at baseline: {A('baseline')!.recurring}</p> : null}
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
  const { st, update } = useApp();
  const [ratings, setRatings] = useState<number[]>(SELF_RATING_ITEMS.map(() => -1));
  const [goals, setGoals] = useState<string[]>([]);
  const [goalNote, setGoalNote] = useState('');
  const [recurring, setRecurring] = useState('');
  const [confidence, setConfidence] = useState(5);
  const [know, setKnow] = useState<number | null>(null);
  const [sjt, setSjt] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [part, setPart] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const post = kind === 'post';
  const knowItems = post ? POST_KNOWLEDGE_ITEMS : KNOWLEDGE_ITEMS;
  const sjtItems = post ? POST_SJT_ITEMS : SJT_ITEMS;
  const [retItems] = useState(() => kind === 'baseline' ? [] : retentionItems(st));
  const save = (sjtC: number, ret?: number) => update(x => ({ ...x, settings: kind === 'baseline' ? { ...x.settings, welcomed: true } : x.settings, assessments: [...x.assessments, {
    kind, at: Date.now(), selfRatings: ratings, sjtCorrect: sjtC, sjtTotal: sjtItems.length, confidence, knowledgeCorrect: know ?? 0, knowledgeTotal: knowItems.length, itemSet: post ? 'post' : 'baseline',
    ...(kind === 'baseline' ? { goals, goalNote: goalNote.trim() || undefined, recurring: recurring.trim() || undefined } : {}), ...(kind !== 'baseline' && explanation.trim() ? { explanation: explanation.trim() } : {}),
    ...(ret !== undefined ? { retentionCorrect: ret, retentionTotal: retItems.length } : {}),
  } as Assessment] }));
  return (<><h1>{KIND_LABEL[kind]} check</h1>
    <p className="muted small">Original, non-validated measures. Not a diagnosis. About 8 to 15 minutes. Stored only on this device.{post ? ' Uses new questions you have not seen in the baseline, plus a retention section from earlier lessons.' : ''}</p>
    {part === 1 && <section className="card">
      {kind === 'baseline' && <fieldset><legend><h2>Your goals</h2></legend><p className="small muted">Choose any that apply.</p>
        {GOALS.map(g => <label key={g} className="check"><input type="checkbox" checked={goals.includes(g)} onChange={e => setGoals(x => e.target.checked ? [...x, g] : x.filter(y => y !== g))} /> {g}</label>)}
        <label className="field">Anything else (optional)<textarea rows={2} value={goalNote} onChange={e => setGoalNote(e.target.value)} /></label>
        <label className="field">Optional: which situations keep coming up for you? For example, a type of conversation, person or time of day.<textarea rows={3} value={recurring} onChange={e => setRecurring(e.target.value)} /></label>
        <p className="small muted">Kept as your own notes. The app does not analyse it.</p></fieldset>}
      <h2>Self-ratings</h2>{SELF_RATING_ITEMS.map((q, i) => <fieldset key={i} className="rating"><legend>{q}</legend>
      <div className="chips">{SELF_RATING_SCALE.map((l, k) => <label key={k} className="chip"><input type="radio" name={`r${i}`} checked={ratings[i] === k} onChange={() => setRatings(r => r.map((v, j) => (j === i ? k : v)))} /> {l}</label>)}</div></fieldset>)}
      <label className="field">Overall, how confident are you in handling difficult emotions? {confidence}/10<input type="range" min={0} max={10} value={confidence} onChange={e => setConfidence(+e.target.value)} /></label>
      <button className="primary" disabled={ratings.includes(-1)} onClick={() => setPart(2)}>Continue</button></section>}
    {part === 2 && <Quiz label="Knowledge" items={knowItems} onDone={r => { setKnow(Object.values(r).filter(Boolean).length); setPart(kind === 'baseline' ? 4 : 3); }} />}
    {part === 3 && <section className="card"><h2>Explain in your own words</h2><label htmlFor="ex">How would you now handle a moment of strong anger at work, step by step? (The app does not grade this; it is kept so you can compare later.)</label>
      <textarea id="ex" rows={5} value={explanation} onChange={e => setExplanation(e.target.value)} /><button className="primary" onClick={() => setPart(4)}>Continue</button></section>}
    {part === 4 && <Quiz label="Situations" items={sjtItems} onDone={r => { const c = Object.values(r).filter(Boolean).length; if (kind === 'baseline' || !retItems.length) { save(c); setPart(5); } else { setSjt(c); setPart(6); } }} />}
    {part === 6 && <><p className="card small">Retention: {retItems.length} questions from lessons you completed earlier, to see what has stayed with you.</p>
      <Quiz label="Retention" items={retItems} onDone={r => { save(sjt, Object.values(r).filter(Boolean).length); setPart(5); }} /></>}
    {part === 5 && <div className="card"><h2>Saved</h2><button className="primary" onClick={() => go('#/progress')}>See progress</button></div>}
  </>);
}

export function Library({ id }: { id?: string }) {
  useEffect(() => { if (id) document.getElementById(id)?.scrollIntoView(); }, [id]);
  const usedBy = (cid: string) => [...SESSIONS.filter(s => s.claimIds.includes(cid)).map(s => s.title), ...SCENARIOS.filter(s => s.claimIds.includes(cid)).map(s => s.title)];
  return (<><h1>Research library</h1>
    <div className="card"><p>Each source below was checked against Crossref metadata (DOI, authors, year, title). The claim text is this app's plain-language summary at abstract level; it was not checked against full texts. Most findings are from adults in research settings and may not transfer exactly to you.</p>
      <p className="small">Four kinds of statement are not the same: a technique may be useful; digital delivery can support an outcome; a specific intervention was evaluated; this app improves outcomes. Only the first three appear in this library, and this app itself has not been evaluated.</p>
      <p className="small muted">Labels: <strong>Direct support</strong> = the app states what the source found; <strong>Cautious extrapolation</strong> = the app applies a finding to a different setting; <strong>Background theory</strong> = frames the curriculum.</p></div>
    {SOURCES.map(s => { const e = EVIDENCE[s.id]; return <section key={s.id} id={s.id} className="card"><h2 className="h3">{s.title}</h2>
      <p className="small">{s.authors} ({s.year}). <em>{s.venue}</em>. <a href={`https://doi.org/${s.doi}`} rel="noopener noreferrer">doi:{s.doi}</a> <span className="badge">DOI verified</span>{e && <> <span className="badge">{USE_LABEL[e.use]}</span></>}</p>
      {e && <dl className="small tradeoff"><div><dt>Type</dt><dd>{e.type}; {e.design}</dd></div><div><dt>Population</dt><dd>{e.population}</dd></div><div><dt>Limitations</dt><dd>{e.limitations}</dd></div></dl>}
      {s.claims.map(c => <div key={c.id}><p>{c.text}</p><p className="small muted">Used in: {usedBy(c.id).slice(0, 6).join('; ') || 'not yet used'}</p></div>)}</section>; })}
    <section className="card"><h2 className="h3">Not cited (could not be verified here)</h2><ul className="small"><li>Beck, J. S., Cognitive Behavior Therapy: Basics and Beyond. The edition could not be verified against a bibliographic record, so it is not cited.</li><li>World Health Organization, Doing What Matters in Times of Stress. Not verified against a bibliographic record here; it was written for people under severe stress, including humanitarian settings, so it is not cited.</li><li>ERQ and DERS-16 questionnaires: licensing for use in an app was not verified, so they are not included.</li></ul></section>
  </>);
}

const DEFAULT_REMINDERS: (ReminderTime & { enabled: boolean })[] = [
  { label: 'Emotional Skills Lab: morning practice', time: '09:00', enabled: true },
  { label: 'Emotional Skills Lab: midday check-in', time: '14:00', enabled: true },
  { label: 'Emotional Skills Lab: evening reflection', time: '20:30', enabled: false },
];
export function Settings() {
  const { st, update, storage, persistent } = useApp();
  const [ask, dialog] = useConfirm();
  const [msg, setMsg] = useState('');
  const [pending, setPending] = useState<AppState | null>(null);
  const [reminders, setReminders] = useState(DEFAULT_REMINDERS);
  const reminderCount = reminders.filter(r => r.enabled).length;
  const downloadReminders = () => {
    const ics = buildReminderIcs(reminders.filter(r => r.enabled));
    const b = new Blob([ics], { type: 'text/calendar' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'emotional-skills-lab-reminders.ics'; a.click();
  };
  const [backupAt, setBackupAt] = useState<number | null>(null);
  useEffect(() => { readPreImportBackup(storage).then(b => setBackupAt(b?.at ?? null)).catch(() => undefined); }, [storage, msg]);
  const download = () => { const b = new Blob([exportData(st)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `emotional-skills-lab-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setMsg('Export downloaded.'); };
  const cur = summarise(st);
  const apply = async (mode: 'replace' | 'merge') => {
    if (!pending) return;
    try { await backupBeforeImport(storage, st); } catch { setMsg('Import stopped: could not save a backup of your current data first. Nothing was changed.'); return; }
    update(x => mode === 'replace' ? pending : mergeStates(x, pending));
    setPending(null); setMsg(mode === 'replace' ? 'Import complete. Your previous data was backed up on this device and can be restored below.' : 'Merge complete. Your previous data was backed up on this device and can be restored below.');
  };
  return (<><h1>Settings and privacy</h1>
    {!persistent && <p className="card warn">Storage is unavailable in this browser mode. Your progress will be lost when you close the app.</p>}
    <section className="card"><h2>Theme</h2><div className="chips">{(['auto', 'light', 'dark'] as const).map(t => <button key={t} className="chip" aria-pressed={st.settings.theme === t} onClick={() => update(x => ({ ...x, settings: { ...x.settings, theme: t } }))}>{t === 'auto' ? 'Match phone' : t[0].toUpperCase() + t.slice(1)}</button>)}</div></section>
    <section className="card"><h2>Reviews, follow-ups and journal</h2><p>The app itself sends no push notifications: there is no server to send them from (by the same design choice as no accounts or analytics). Due reviews and follow-ups appear on Today when you open the app. Review intervals are {REVIEW_INTERVALS_DAYS.join(', ')} days (an instructional design choice).</p>
      <label className="check"><input type="checkbox" checked={st.settings.followups?.enabled ?? true} onChange={e => update(x => ({ ...x, settings: { ...x.settings, followups: { enabled: e.target.checked } } }))} /> Offer follow-up checks about 2 and 6 weeks after the programme</label>
      <label className="check"><input type="checkbox" checked={st.settings.journalPrompts ?? true} onChange={e => update(x => ({ ...x, settings: { ...x.settings, journalPrompts: e.target.checked } }))} /> Offer to save reflections to the journal after sessions and scenarios</label></section>
    <section className="card"><h2>Daily reminders</h2>
      <p className="small">To be pinged a few times a day, pick times below and download a small calendar file. Import it once into your phone's own calendar or reminders app (Add, or Subscribe/Import depending on the app); it repeats every day from there until you delete it, with no app or account involved.</p>
      {reminders.map((r, i) => <div key={r.label} className="row-btns tight" style={{ alignItems: 'center' }}>
        <label className="check" style={{ flex: 1 }}><input type="checkbox" checked={r.enabled} onChange={e => setReminders(x => x.map((y, j) => j === i ? { ...y, enabled: e.target.checked } : y))} /> {r.label.replace('Emotional Skills Lab: ', '')}</label>
        <input type="time" value={r.time} aria-label={`Time for ${r.label.replace('Emotional Skills Lab: ', '')}`} onChange={e => setReminders(x => x.map((y, j) => j === i ? { ...y, time: e.target.value } : y))} disabled={!r.enabled} /></div>)}
      <button className="primary" disabled={!reminderCount} onClick={downloadReminders}>Download {reminderCount || ''} reminder{reminderCount === 1 ? '' : 's'} (.ics)</button>
      <p className="small muted">Deleting the imported event in your calendar app stops future reminders; this app cannot do that for you.</p></section>
    <section className="card"><h2>Offline use</h2><OfflineNote /></section>
    <section className="card"><h2>Your data</h2><p>Everything is stored in this browser on this device (IndexedDB). It is not encrypted. Nothing is sent anywhere: there are no accounts, analytics or servers. Clearing browser data, uninstalling, or private mode can erase it, and anyone who can use this device and browser can open it. Export a backup now and then.</p>
      <div className="row-btns"><button onClick={download}>Export backup</button>
        <label className="btn">Import backup<input className="sr-only" type="file" accept="application/json" onChange={async e => {
          const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
          try { setPending(importData(await f.text())); setMsg(''); } catch (err) { setMsg(`Import failed: ${err instanceof DataError ? err.message : 'the file could not be read.'} Nothing was changed.`); }
        }} /></label></div>
      {pending && <div className="card accent" role="region" aria-label="Confirm import"><h3>Import this backup?</h3>
        <p className="small">Backup contains {summarise(pending).sessions} completed sessions, {summarise(pending).journal} journal entries, {summarise(pending).scenarios} scenario attempts and {summarise(pending).assessments} checks. This device has {cur.sessions}, {cur.journal}, {cur.scenarios} and {cur.assessments}.</p>
        <p className="small">Either way, your current data is saved as a backup on this device first.</p>
        <div className="row-btns"><button className="primary" onClick={() => apply('merge')}>Merge with current data</button><button onClick={() => apply('replace')}>Replace current data</button><button onClick={() => { setPending(null); setMsg('Import cancelled. Nothing was changed.'); }}>Cancel</button></div></div>}
      {backupAt && <p className="small">Backup from before the last import: {fmt(backupAt)}. <button className="link" onClick={async () => { const b = await readPreImportBackup(storage); if (b && await ask({ title: 'Restore the data from before the last import?', body: <p>Your current data on this device will be replaced by the backup from {fmt(b.at)}.</p>, confirm: 'Restore backup' })) { update(() => b.state); setMsg('Restored data from before the last import.'); } }}>Restore it</button></p>}
      <div className="row-btns">
        <button className="danger" onClick={async () => { if (await ask({ title: 'Reset progress?', body: <><p>Cleared: sessions, scores, reviews and scenario history.</p><p>Kept: journal, baseline and other checks, settings.</p><p className="small muted">This cannot be undone unless you export a backup first.</p></>, confirm: 'Reset progress', danger: true })) { update(x => ({ ...emptyState(), journal: x.journal, assessments: x.assessments, settings: x.settings })); setMsg('Progress reset.'); } }}>Reset progress</button>
        <button className="danger" onClick={async () => { if (await ask({ title: 'Delete all data from this device?', body: <><p>Everything is deleted permanently: progress, journal, checks, settings and any import backup.</p><p className="small muted">Export a backup first if you want a copy. This cannot be undone.</p></>, confirm: 'Delete everything', danger: true, typed: 'DELETE' })) { await deleteAll(storage); update(() => emptyState()); setMsg('All data deleted.'); } }}>Delete all data</button></div>
      <p role="status">{msg}</p></section>
    <section className="card"><h2>How progress works</h2><ul><li>Completion: sessions finished.</li><li>Mastery: a phase checkpoint scored at {MASTERY_THRESHOLD * 100}% or more. This threshold is a design choice, not a research standard.</li><li>Retention: correct answers on items reviewed {REVIEW_INTERVALS_DAYS.join(', ')} days after mastery. A wrong answer sends the item back to the first interval.</li></ul></section>
    {dialog}
    <section className="card"><h2>About</h2><p className="small">Emotional Skills Lab version {APP_VERSION}, data schema {st.schema}. Self-guided education, not a medical device. It has not been evaluated in a study, so it makes no claim to improve outcomes. <a href="#/welcome">Reopen the introduction</a> · <a href="#/library">Evidence and its limits</a> · <a href="#/help">Safety</a></p>
      <p className="small muted">Updates: when a new version is published, it downloads in the background and is used the next time you open the app. Your data stays in place and is upgraded automatically if its format changes.</p></section>
  </>);
}

export function Help() {
  const { emergency, teleManas, posh } = SUPPORT;
  return (<><h1>Safety and support</h1>
    <div className="card"><p>Emotional Skills Lab is self-guided skills training. It is not therapy, diagnosis or crisis support, and it has not been tested as a clinical intervention.</p></div>
    <section className="card"><h2>In an emergency (India)</h2><p>If you feel unsafe or may harm yourself or someone else, call <a className="pad" href={`tel:${emergency.number}`}>{emergency.number}</a> now. It is the national {emergency.label}.</p></section>
    <section className="card"><h2>Mental-health support (India)</h2><p>{teleManas.label} is free and available by phone: <a className="pad" href="tel:14416">{teleManas.numbers[0]}</a> or <a className="pad" href="tel:18008914416">{teleManas.numbers[1]}</a>. You do not need to be in crisis to call. If difficult emotions persist or affect sleep, work or relationships for weeks, a qualified professional is the right next step.</p></section>
    <section className="card"><h2>Sexual harassment at work (India)</h2><p>{posh.summary}</p><p className="small muted">This is general information about the law, not legal advice.</p></section>
    <p className="small muted">Numbers and the legal route were checked on official government websites (112.gov.in, telemanas.mohfw.gov.in, wcd.nic.in) on 13 Oct 2026. Outside India, use your local emergency number. Content in this app is informed by published research listed in the Library, simplified for practice; individual results vary.</p></>);
}

const PHASE_ROWS = (st: AppState) => PHASES.map(p => {
  const ss = SESSIONS.filter(s => s.phase === p.id);
  const revs = Object.entries(st.items).filter(([id]) => ss.some(s => s.id === ITEM_SKILL[id])).flatMap(([, i]) => i.reviews);
  return { p, ss, done: ss.filter(s => st.completed[s.id]).length, mastered: phaseMastered(st, p.id), retention: revs.length ? revs.filter(r => r.correct).length / revs.length : null };
});
/** Me: progress summary, reflections, assessments and everything else that used to be a tab or header link. */
export function Me() {
  const { st } = useApp();
  const m = metrics(st); const rows = PHASE_ROWS(st);
  return (<><h1>Me</h1>
    <section className="card" aria-labelledby="me-prog"><h2 id="me-prog">Progress</h2>
      <p className="small">{Object.keys(st.completed).length}/{SESSIONS.length} sessions finished · {m.masteredPhases}/{PHASES.length} phases mastered · retention {pct(m.retention)}</p>
      <details><summary>By phase</summary><table className="small phase-table"><thead><tr><th scope="col">Phase</th><th scope="col">Done</th><th scope="col">Mastery</th><th scope="col">Retention</th></tr></thead><tbody>
        {rows.map(r => <tr key={r.p.id}><th scope="row">{r.p.id}. {r.p.title}</th><td>{r.done}/{r.ss.length}</td><td>{r.mastered ? 'Mastered' : r.done ? 'Not yet' : '–'}</td><td>{pct(r.retention)}</td></tr>)}</tbody></table></details>
      <p className="small"><a href="#/progress">Full progress: per-skill detail, checkpoints, reviews, baseline/post/follow-up checks</a></p>
    </section>
    <nav aria-label="Me sections"><ul className="list me-links">
      <li><a className="row" href="#/me/reflections"><IconPencil className="row-icon" /><span>Reflections</span><span className="muted small">{st.journal.length} {st.journal.length === 1 ? "entry" : "entries"}</span></a></li>
      <li><a className="row" href="#/library"><IconBook className="row-icon" /><span>Library</span><span className="muted small">evidence and sources</span></a></li>
      <li><a className="row" href="#/settings"><IconSettings className="row-icon" /><span>Settings</span><span className="muted small">theme, backup, data</span></a></li>
    </ul></nav>
    <p className="small muted">All scenarios and reviews live under <a href="#/programme">Programme</a>. Help and safety is always one tap away at the top of every page.</p>
  </>);
}
