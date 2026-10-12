/** Versioned data handling: migrations, validation, corrupt-data recovery, export/import envelopes and merge (spec 3.3, 10.4). */
import { emptyState, SCHEMA_VERSION, type AppState } from './state';

export const EXPORT_FORMAT = 'emotional-skills-lab-export';
export const EXPORT_FORMAT_VERSION = 1;
export class DataError extends Error {}

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const num = (x: unknown) => typeof x === 'number' && Number.isFinite(x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Ordered migrations: MIGRATIONS[n] upgrades schema n to n+1. Each is pure and tested. */
export const MIGRATIONS: Record<number, (s: Record<string, unknown>) => Record<string, unknown>> = {
  // 1 -> 2: add meta; legacy 'followup' assessments kept as-is; dedupe journal ids; clamp phase scores.
  1: s => ({ ...s, schema: 2, meta: { createdAt: Date.now() } }),
  // 2 -> 3: reflection field "outcome" held what happened next; it moves to the dedicated "next" field (spec 9.7).
  2: s => ({ ...s, schema: 3, journal: Array.isArray(s.journal) ? s.journal.map(e => {
    if (!isObj(e) || e.outcome === undefined || e.next !== undefined) return e;
    const { outcome, ...rest } = e; return { ...rest, next: outcome };
  }) : s.journal }),
};

/** Upgrade any supported raw state to the current schema and validate it. Throws DataError when it cannot. */
export function migrate(raw: unknown): AppState {
  if (!isObj(raw)) throw new DataError('Data is not an object.');
  let s: Record<string, unknown> = raw;
  if (!num(s.schema)) throw new DataError('Data has no schema version.');
  if ((s.schema as number) > SCHEMA_VERSION) throw new DataError(`Data is from a newer version of the app (schema ${s.schema}). Update the app before importing it.`);
  const from: number[] = [];
  while ((s.schema as number) < SCHEMA_VERSION) {
    const m = MIGRATIONS[s.schema as number];
    if (!m) throw new DataError(`No migration from schema ${s.schema}.`);
    from.push(s.schema as number); s = m(s);
  }
  return validate(s, from);
}

/** Structural validation and normalisation: rejects missing collections; drops duplicates and out-of-range values. */
export function validate(s: Record<string, unknown>, migratedFrom: number[] = []): AppState {
  for (const k of ['completed', 'phaseResults', 'items'] as const) if (!isObj(s[k])) throw new DataError(`Missing or invalid "${k}".`);
  for (const k of ['scenarios', 'journal', 'assessments'] as const) if (!Array.isArray(s[k])) throw new DataError(`Missing or invalid "${k}".`);
  const base = emptyState();
  const st = { ...base, ...s, settings: { ...base.settings, ...(isObj(s.settings) ? s.settings : {}) } } as AppState;
  const seen = new Set<string>();
  st.journal = st.journal.filter(e => isObj(e) && typeof e.id === 'string' && num(e.at) && !seen.has(e.id) && (seen.add(e.id), true))
    .map(e => ({ ...e, emotions: Array.isArray(e.emotions) ? e.emotions.filter(x => isObj(x) && typeof x.name === 'string' && num(x.intensity)).map(x => ({ name: x.name, intensity: Math.min(10, Math.max(0, x.intensity)) })) : [] }));
  for (const [p, rs] of Object.entries(st.phaseResults)) st.phaseResults[+p] = (Array.isArray(rs) ? rs : []).filter(r => isObj(r) && num(r.score) && num(r.at)).map(r => ({ ...r, score: clamp01(r.score) }));
  const sk = new Set<string>();
  st.scenarios = st.scenarios.filter(a => isObj(a) && typeof a.scenarioId === 'string' && num(a.at) && [0, 1, 2].includes(a.quality as number)
    && !sk.has(a.scenarioId + '@' + a.at) && (sk.add(a.scenarioId + '@' + a.at), true));
  st.assessments = st.assessments.filter(a => isObj(a) && typeof a.kind === 'string' && num(a.at) && num(a.sjtCorrect) && num(a.sjtTotal) && a.sjtCorrect >= 0 && a.sjtCorrect <= a.sjtTotal);
  st.schema = SCHEMA_VERSION;
  st.meta = { createdAt: st.meta?.createdAt ?? Date.now(), ...(migratedFrom.length || st.meta?.migratedFrom ? { migratedFrom: [...(st.meta?.migratedFrom ?? []), ...migratedFrom] } : {}) };
  return st;
}

export function exportData(st: AppState, now = new Date()) {
  return JSON.stringify({ app: 'emotional-skills-lab', format: EXPORT_FORMAT, formatVersion: EXPORT_FORMAT_VERSION, schema: st.schema, exportedAt: now.toISOString(), state: st }, null, 2);
}
/** Parse and validate an export file. Never writes anything; the caller decides replace or merge after confirmation. */
export function importData(json: string): AppState {
  let o: unknown;
  try { o = JSON.parse(json); } catch { throw new DataError('The file is not valid JSON. It may be damaged or incomplete.'); }
  if (!isObj(o) || o.app !== 'emotional-skills-lab' || !isObj(o.state)) throw new DataError('Not an Emotional Skills Lab export file.');
  if (num(o.formatVersion) && (o.formatVersion as number) > EXPORT_FORMAT_VERSION) throw new DataError('This export was made by a newer version of the app.');
  return migrate(o.state);
}
export interface ImportSummary { sessions: number; journal: number; scenarios: number; assessments: number }
export const summarise = (s: AppState): ImportSummary => ({ sessions: Object.keys(s.completed).length, journal: s.journal.length, scenarios: s.scenarios.length, assessments: s.assessments.length });

/** Merge an import into current data without losing either side: unions by stable id/timestamp; earliest completion kept. */
export function mergeStates(cur: AppState, inc: AppState): AppState {
  const out: AppState = structuredClone(cur);
  for (const [id, c] of Object.entries(inc.completed)) if (!out.completed[id] || c.at < out.completed[id].at) out.completed[id] = c;
  for (const [p, rs] of Object.entries(inc.phaseResults)) { const have = new Set((out.phaseResults[+p] ?? []).map(r => r.at)); out.phaseResults[+p] = [...(out.phaseResults[+p] ?? []), ...rs.filter(r => !have.has(r.at))].sort((a, b) => a.at - b.at); }
  for (const [id, it] of Object.entries(inc.items)) { const c = out.items[id]; if (!c || it.reviews.length > c.reviews.length) out.items[id] = it; }
  const byKey = <T,>(a: T[], b: T[], k: (x: T) => string) => { const m = new Map(a.map(x => [k(x), x])); for (const x of b) if (!m.has(k(x))) m.set(k(x), x); return [...m.values()]; };
  out.journal = byKey(out.journal, inc.journal, e => e.id).sort((a, b) => b.at - a.at);
  out.scenarios = byKey(out.scenarios, inc.scenarios, a => a.scenarioId + '@' + a.at).sort((a, b) => a.at - b.at);
  out.assessments = byKey(out.assessments, inc.assessments, a => a.kind + '@' + a.at).sort((a, b) => a.at - b.at);
  out.itemLog = { ...(inc.itemLog ?? {}) };
  for (const [k, v] of Object.entries(cur.itemLog ?? {})) out.itemLog[k] = byKey(v, out.itemLog[k] ?? [], r => r.ctx + '@' + r.at).sort((a, b) => a.at - b.at);
  out.explanations = { ...(inc.explanations ?? {}) };
  for (const [k, v] of Object.entries(cur.explanations ?? {})) out.explanations[k] = byKey(v, out.explanations[k] ?? [], r => String(r.at)).sort((a, b) => a.at - b.at);
  out.activities = { ...(inc.activities ?? {}), ...(cur.activities ?? {}) };
  return validate(out as unknown as Record<string, unknown>);
}
