import { SESSIONS } from '../content/sessions';
import { PHASES } from '../content/phases';
import type { CheckItem, PhaseId } from '../content/types';

export const MASTERY_THRESHOLD = 0.8; // design choice, not research-derived
export const REVIEW_INTERVALS_DAYS = [2, 7, 21];
export const SCHEMA_VERSION = 1;
const DAY = 86400000;

export interface ItemState { stage: number; due: number; reviews: { at: number; correct: boolean }[] }
export interface ScenarioAttempt { scenarioId: string; at: number; emotions: number[]; response: number; quality: 0 | 1 | 2; factsOk: boolean }
export interface JournalEntry {
  id: string; at: number; type: 'checkin' | 'reflection' | 'plan';
  emotions: { name: string; intensity: number }[]; trigger?: string; facts?: string; interpretation?: string;
  urge?: string; strategy?: string; outcome?: string; lesson?: string; note?: string;
}
export interface Assessment { kind: 'baseline' | 'post' | 'followup'; at: number; selfRatings: number[]; sjtCorrect: number; sjtTotal: number }
export interface AppState {
  schema: number;
  completed: Record<string, { at: number; checks: Record<string, boolean> }>;
  phaseResults: Record<number, { at: number; score: number; mastered: boolean }[]>;
  items: Record<string, ItemState>;
  scenarios: ScenarioAttempt[];
  journal: JournalEntry[];
  assessments: Assessment[];
  settings: { theme: 'auto' | 'light' | 'dark'; reducedMotion: boolean };
}
export const emptyState = (): AppState => ({
  schema: SCHEMA_VERSION, completed: {}, phaseResults: {}, items: {}, scenarios: [], journal: [], assessments: [],
  settings: { theme: 'auto', reducedMotion: false },
});

export const ALL_ITEMS: Record<string, CheckItem> = Object.fromEntries(SESSIONS.flatMap(s => s.checks.map(c => [c.id, c])));

export function isUnlocked(st: AppState, sessionId: string): boolean {
  const i = SESSIONS.findIndex(s => s.id === sessionId);
  return i <= 0 || !!st.completed[SESSIONS[i - 1].id];
}
export const nextSession = (st: AppState) => SESSIONS.find(s => !st.completed[s.id]);

/** Completion layer: lesson done (checks answered). Completion never implies mastery. */
export function completeSession(st: AppState, sessionId: string, checks: Record<string, boolean>, now = Date.now()): AppState {
  const s = SESSIONS.find(x => x.id === sessionId);
  if (!s) throw new Error('unknown session');
  const next: AppState = structuredClone(st);
  next.completed[sessionId] = { at: now, checks };
  if (s.kind === 'checkpoint') recordPhase(next, s.phase, checks, now);
  return next;
}

/** Mastery layer: phase checkpoint plus all lesson checks of the phase, scored on first-try answers. */
function recordPhase(st: AppState, phase: PhaseId, checkpointChecks: Record<string, boolean>, now: number) {
  const vals = Object.values(checkpointChecks);
  const score = vals.length ? vals.filter(Boolean).length / vals.length : 0;
  const mastered = score >= MASTERY_THRESHOLD;
  (st.phaseResults[phase] ??= []).push({ at: now, score, mastered });
  if (mastered) {
    for (const s of SESSIONS.filter(x => x.phase === phase))
      for (const c of s.checks) if (!st.items[c.id]) st.items[c.id] = { stage: 0, due: now + REVIEW_INTERVALS_DAYS[0] * DAY, reviews: [] };
  }
}
export const phaseMastered = (st: AppState, p: PhaseId) => (st.phaseResults[p] ?? []).some(r => r.mastered);

/** Retention layer: spaced reviews after mastery. */
export const dueReviews = (st: AppState, now = Date.now()) =>
  Object.entries(st.items).filter(([, v]) => v.due <= now && v.stage < REVIEW_INTERVALS_DAYS.length).map(([k]) => k);

export function answerReview(st: AppState, itemId: string, correct: boolean, now = Date.now()): AppState {
  const next = structuredClone(st);
  const it = next.items[itemId];
  if (!it) return next;
  it.reviews.push({ at: now, correct });
  if (correct) { it.stage += 1; it.due = it.stage < REVIEW_INTERVALS_DAYS.length ? now + REVIEW_INTERVALS_DAYS[it.stage] * DAY : Number.MAX_SAFE_INTEGER; }
  else { it.stage = 0; it.due = now + REVIEW_INTERVALS_DAYS[0] * DAY; }
  return next;
}
export interface Metrics { completion: number; masteredPhases: number; retention: number | null; reviewsDone: number; scenarioQuality: number | null }
export function metrics(st: AppState): Metrics {
  const reviews = Object.values(st.items).flatMap(i => i.reviews);
  return {
    completion: Object.keys(st.completed).length / SESSIONS.length,
    masteredPhases: PHASES.filter(p => phaseMastered(st, p.id)).length,
    retention: reviews.length ? reviews.filter(r => r.correct).length / reviews.length : null,
    reviewsDone: reviews.length,
    scenarioQuality: st.scenarios.length ? st.scenarios.reduce((a, s) => a + s.quality, 0) / (2 * st.scenarios.length) : null,
  };
}
export function emotionFrequency(st: AppState) {
  const m = new Map<string, number>();
  for (const e of st.journal) for (const x of e.emotions) m.set(x.name, (m.get(x.name) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
export function followupDue(st: AppState, now = Date.now()) {
  const post = st.assessments.find(a => a.kind === 'post');
  return !!post && !st.assessments.some(a => a.kind === 'followup') && now - post.at >= 30 * DAY;
}

/** Export / import with validation */
export function exportData(st: AppState) { return JSON.stringify({ app: 'emotional-skills-lab', exportedAt: new Date().toISOString(), state: st }, null, 2); }
export function importData(json: string): AppState {
  const o = JSON.parse(json);
  if (o?.app !== 'emotional-skills-lab' || typeof o.state !== 'object') throw new Error('Not an Emotional Skills Lab export file.');
  const s = o.state as AppState;
  if (s.schema !== SCHEMA_VERSION) throw new Error(`Unsupported data version ${s.schema}.`);
  for (const k of ['completed', 'phaseResults', 'items'] as const) if (typeof s[k] !== 'object') throw new Error(`Missing ${k}.`);
  for (const k of ['scenarios', 'journal', 'assessments'] as const) if (!Array.isArray(s[k])) throw new Error(`Missing ${k}.`);
  return { ...emptyState(), ...s };
}
