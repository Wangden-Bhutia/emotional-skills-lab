import { SESSIONS } from '../content/sessions';
import { PHASES } from '../content/phases';
import type { CheckItem, PhaseId } from '../content/types';

export const MASTERY_THRESHOLD = 0.8; // design choice, not research-derived
export const REVIEW_INTERVALS_DAYS = [2, 7, 21];
export const SCHEMA_VERSION = 3;
const DAY = 86400000;

export interface ItemState { stage: number; due: number; reviews: { at: number; correct: boolean }[] }
export interface ScenarioAttempt { scenarioId: string; at: number; emotions: number[]; response: number; quality: 0 | 1 | 2; factsOk: boolean; followUp?: number; followUpQuality?: 0 | 1 | 2 }
export interface JournalEntry {
  id: string; at: number; type: 'checkin' | 'reflection' | 'plan';
  emotions: { name: string; intensity: number }[]; trigger?: string; facts?: string; interpretation?: string;
  urge?: string; strategy?: string; outcome?: string; next?: string; lesson?: string; note?: string; editedAt?: number;
}
export type AssessmentKind = 'baseline' | 'post' | 'followup2' | 'followup6' | 'followup';
export interface Assessment {
  kind: AssessmentKind; at: number; selfRatings: number[]; sjtCorrect: number; sjtTotal: number;
  goals?: string[]; goalNote?: string; confidence?: number; knowledgeCorrect?: number; knowledgeTotal?: number; explanation?: string;
  /** Optional baseline reflection on recurring situations (spec 8.1). */ recurring?: string;
  /** Retention section: earlier-phase lesson items (spec 8.2). */ retentionCorrect?: number; retentionTotal?: number; itemSet?: 'baseline' | 'post';
}
export type Ctx = 'lesson' | 'checkpoint' | 'review';
export interface ExplainRecord { at: number; text: string; self: number[]; revised: boolean }
export interface AppState {
  schema: number;
  completed: Record<string, { at: number; checks: Record<string, boolean> }>;
  phaseResults: Record<number, { at: number; score: number; mastered: boolean }[]>;
  items: Record<string, ItemState>;
  scenarios: ScenarioAttempt[];
  journal: JournalEntry[];
  assessments: Assessment[];
  settings: { theme: 'auto' | 'light' | 'dark'; reducedMotion: boolean; followups?: { enabled: boolean; postponedUntil?: number }; journalPrompts?: boolean; welcomed?: boolean };
  /** Lessons left mid-way, so progress survives close or reload (spec 9.4). */
  inProgress?: Record<string, { stage: 'explain' | 'check'; at: number }>;
  /** Added in schema 2. */
  meta?: { createdAt: number; migratedFrom?: number[] };
  /** Every answered item with context, used for per-skill mastery and item rotation. */
  itemLog?: Record<string, { at: number; correct: boolean; ctx: Ctx }[]>;
  /** Explanation-back records per session (text stays on device; never graded by the app). */
  explanations?: Record<string, ExplainRecord[]>;
  activities?: Record<string, { at: number; correct: number; total: number }>;
}
export const emptyState = (): AppState => ({
  schema: SCHEMA_VERSION, completed: {}, phaseResults: {}, items: {}, scenarios: [], journal: [], assessments: [],
  settings: { theme: 'auto', reducedMotion: false }, meta: { createdAt: Date.now() },
});

export const ALL_ITEMS: Record<string, CheckItem> = Object.fromEntries(SESSIONS.flatMap(s => [...s.checks, ...s.altChecks].map(c => [c.id, c])));
/** Item id -> session id that teaches it (the skill it measures). */
export const ITEM_SKILL: Record<string, string> = Object.fromEntries(SESSIONS.flatMap(s => [...s.checks, ...s.altChecks].map(c => [c.id, s.id])));
export const SKILL_SESSIONS = SESSIONS.filter(s => s.kind === 'lesson' || s.kind === 'practice');

export function isUnlocked(st: AppState, sessionId: string): boolean {
  const i = SESSIONS.findIndex(s => s.id === sessionId);
  return i <= 0 || !!st.completed[SESSIONS[i - 1].id];
}
export const nextSession = (st: AppState) => SESSIONS.find(s => !st.completed[s.id]);

/** Completion layer: lesson done (checks answered). Completion never implies mastery. */
export function logItems(st: AppState, res: Record<string, boolean>, ctx: Ctx, now = Date.now()) {
  st.itemLog ??= {};
  for (const [k, v] of Object.entries(res)) (st.itemLog[k] ??= []).push({ at: now, correct: v, ctx });
}
export function completeSession(st: AppState, sessionId: string, checks: Record<string, boolean>, now = Date.now()): AppState {
  const s = SESSIONS.find(x => x.id === sessionId);
  if (!s) throw new Error('unknown session');
  const next: AppState = structuredClone(st);
  logItems(next, checks, s.kind === 'checkpoint' || s.kind === 'review' ? 'checkpoint' : 'lesson', now);
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
      for (const c of [...s.checks, ...s.altChecks]) if (!st.items[c.id]) st.items[c.id] = { stage: 0, due: now + REVIEW_INTERVALS_DAYS[0] * DAY, reviews: [] };
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
  logItems(next, { [itemId]: correct }, 'review', now);
  it.reviews.push({ at: now, correct });
  if (correct) { it.stage += 1; it.due = it.stage < REVIEW_INTERVALS_DAYS.length ? now + REVIEW_INTERVALS_DAYS[it.stage] * DAY : Number.MAX_SAFE_INTEGER; }
  else { it.stage = 0; it.due = now + REVIEW_INTERVALS_DAYS[0] * DAY; }
  return next;
}
export interface Metrics { completion: number; masteredPhases: number; masteredSkills: number; retention: number | null; reviewsDone: number; scenarioQuality: number | null }
export function metrics(st: AppState): Metrics {
  const reviews = Object.values(st.items).flatMap(i => i.reviews);
  return {
    completion: Object.keys(st.completed).length / SESSIONS.length,
    masteredPhases: PHASES.filter(p => phaseMastered(st, p.id)).length,
    masteredSkills: SKILL_SESSIONS.filter(s => skillStatus(st, s.id).status === 'mastered').length,
    retention: reviews.length ? reviews.filter(r => r.correct).length / reviews.length : null,
    reviewsDone: reviews.length,
    scenarioQuality: st.scenarios.length ? st.scenarios.reduce((a, s) => a + s.quality, 0) / (2 * st.scenarios.length) : null,
  };
}
/** Calendar days (local) that had any recorded activity: a session, a review, a scenario, or a journal entry. */
export function activityDays(st: AppState): Set<string> {
  const days = new Set<string>();
  const add = (t: number) => days.add(new Date(t).toDateString());
  for (const c of Object.values(st.completed)) add(c.at);
  for (const i of Object.values(st.items)) for (const r of i.reviews) add(r.at);
  for (const s of st.scenarios) add(s.at);
  for (const j of st.journal) add(j.at);
  return days;
}
/** Consecutive days of activity up to and including today, or ending yesterday if today has nothing yet
 * (so the streak does not drop to 0 the moment you wake up). */
export function currentStreak(st: AppState, now = Date.now()): number {
  const days = activityDays(st);
  let t = now;
  if (!days.has(new Date(t).toDateString())) t -= DAY;
  let n = 0;
  while (days.has(new Date(t).toDateString())) { n++; t -= DAY; }
  return n;
}
export function emotionFrequency(st: AppState) {
  const m = new Map<string, number>();
  for (const e of st.journal) for (const x of e.emotions) m.set(x.name, (m.get(x.name) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
export const FOLLOWUP_DAYS = { followup2: 14, followup6: 42 } as const;
/** Which follow-up (about 2 and about 6 weeks after the post check) is due, if any. Postponable and disableable. */
export function followupDue(st: AppState, now = Date.now()): 'followup2' | 'followup6' | null {
  const post = st.assessments.find(a => a.kind === 'post');
  const f = st.settings.followups ?? { enabled: true };
  if (!post || !f.enabled || (f.postponedUntil && now < f.postponedUntil)) return null;
  for (const k of ['followup2', 'followup6'] as const)
    if (!st.assessments.some(a => a.kind === k) && now - post.at >= FOLLOWUP_DAYS[k] * DAY) return k;
  return null;
}
export const postponeFollowup = (st: AppState, now = Date.now()): AppState =>
  ({ ...st, settings: { ...st.settings, followups: { enabled: true, postponedUntil: now + 7 * DAY } } });

/** Deterministic shuffle so a given attempt number always yields the same order (testable). */
function seeded<T>(arr: T[], seed: number): T[] {
  const a = [...arr]; let x = seed * 9301 + 49297;
  for (let i = a.length - 1; i > 0; i--) { x = (x * 9301 + 49297) % 233280; const j = Math.floor((x / 233280) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const exposures = (st: AppState, id: string, ctx?: Ctx) => (st.itemLog?.[id] ?? []).filter(r => !ctx || r.ctx === ctx).length;

/** Layer 3 item selection for a checkpoint/review: phase pool, least-exposed first (so retakes use different items),
 * plus up to 2 cumulative items from earlier phases. */
export function checkpointItems(st: AppState, sessionId: string, draw = 8): CheckItem[] {
  const s = SESSIONS.find(x => x.id === sessionId)!;
  const attempt = (st.phaseResults[s.phase] ?? []).length + 1;
  const phaseSessions = SESSIONS.filter(x => x.phase === s.phase && SESSIONS.indexOf(x) <= SESSIONS.indexOf(s));
  const pool = [...s.checks, ...phaseSessions.filter(x => x.id !== s.id).flatMap(x => [...x.checks, ...x.altChecks])];
  const pick = seeded(pool, attempt).sort((a, b) => exposures(st, a.id, 'checkpoint') - exposures(st, b.id, 'checkpoint')).slice(0, draw);
  const earlier = SESSIONS.filter(x => x.phase < s.phase && (x.kind === 'lesson' || x.kind === 'practice')).flatMap(x => x.checks);
  const cumulative = seeded(earlier, attempt + s.week).sort((a, b) => exposures(st, a.id) - exposures(st, b.id)).slice(0, earlier.length ? 2 : 0);
  return [...pick, ...cumulative];
}
/** Items for a lesson check: original items first; on retake, least-seen items (including alternatives) first. */
export function lessonItems(st: AppState, sessionId: string): CheckItem[] {
  const s = SESSIONS.find(x => x.id === sessionId)!;
  if (!st.completed[sessionId]) return s.checks;
  return [...s.checks, ...s.altChecks].sort((a, b) => exposures(st, a.id, 'lesson') - exposures(st, b.id, 'lesson')).slice(0, s.checks.length);
}
export function retakeLesson(st: AppState, _sessionId: string, res: Record<string, boolean>, now = Date.now()): AppState {
  const next = structuredClone(st); logItems(next, res, 'lesson', now); return next;
}

export type SkillStatus = 'not started' | 'learning' | 'mastered' | 'needs practice';
/** Per-skill mastery from delayed (checkpoint/review) answers: latest answer per item, at least 2 items, >= threshold. */
export function skillStatus(st: AppState, skillId: string): { status: SkillStatus; score: number | null; answered: number } {
  const s = SESSIONS.find(x => x.id === skillId)!;
  if (!st.completed[skillId]) return { status: 'not started', score: null, answered: 0 };
  const latest = [...s.checks, ...s.altChecks].map(c => (st.itemLog?.[c.id] ?? []).filter(r => r.ctx !== 'lesson').at(-1)).filter(Boolean) as { correct: boolean }[];
  if (latest.length < 2) return { status: 'learning', score: latest.length ? latest.filter(r => r.correct).length / latest.length : null, answered: latest.length };
  const score = latest.filter(r => r.correct).length / latest.length;
  return { status: score >= MASTERY_THRESHOLD ? 'mastered' : 'needs practice', score, answered: latest.length };
}
/** Remediation: sessions whose items were missed in a result set. */
export function remediationFor(res: Record<string, boolean>): string[] {
  return [...new Set(Object.entries(res).filter(([, v]) => !v).map(([k]) => ITEM_SKILL[k]).filter(Boolean))];
}


/** Retention section for post-programme and follow-up checks: lesson items from completed phases 1 to 8,
 * least exposed first, at most one per skill, deterministic for a given state. */
export function retentionItems(st: AppState, n = 6): CheckItem[] {
  const pool = SKILL_SESSIONS.filter(s => s.phase < 9 && st.completed[s.id]).map(s => [...s.checks, ...s.altChecks].sort((a, b) => exposures(st, a.id) - exposures(st, b.id) || a.id.localeCompare(b.id))[0]);
  return seeded(pool, pool.length).sort((a, b) => exposures(st, a.id) - exposures(st, b.id)).slice(0, n);
}
