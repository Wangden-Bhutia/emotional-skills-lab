import { describe, expect, it } from 'vitest';
import { SESSIONS } from '../../src/content/sessions';
import { SCENARIOS, CATEGORY_LABELS } from '../../src/content/scenarios';
import { SOURCES } from '../../src/content/sources';
import { PHASES } from '../../src/content/phases';
import { SJT_ITEMS, SELF_RATING_ITEMS } from '../../src/content/measures';

const claimIds = new Set(SOURCES.flatMap(s => s.claims.map(c => c.id)));
const all = [...SESSIONS.flatMap(s => [s.title, s.objective, ...s.teach, s.example ?? '', ...s.practice, s.reflect, ...s.checks.flatMap(c => [c.q, c.why, ...c.options])]),
  ...SCENARIOS.flatMap(s => [s.title, s.situation, ...s.facts, ...s.interpretations, ...s.emotionOptions, ...s.responses.flatMap(r => [r.text, r.feedback])])];

describe('curriculum completeness', () => {
  it('has 60 sessions over 12 weeks, 5 per week', () => {
    expect(SESSIONS).toHaveLength(60);
    for (let w = 1; w <= 12; w++) expect(SESSIONS.filter(s => s.week === w).map(s => s.day)).toEqual([1, 2, 3, 4, 5]);
  });
  it('covers all 9 phases and each phase ends in a checkpoint', () => {
    expect(PHASES).toHaveLength(9);
    for (const p of PHASES) { const ss = SESSIONS.filter(s => s.phase === p.id); expect(ss.length).toBeGreaterThan(0); expect(ss.at(-1)!.kind).toBe('checkpoint'); }
  });
  it.each(SESSIONS.map(s => [s.id, s] as const))('session %s is substantive and well formed', (_id, s) => {
    expect(s.teach.length).toBeGreaterThanOrEqual(1);
    if (s.kind === 'lesson' || s.kind === 'practice') { expect(s.example, 'worked example').toBeTruthy(); expect((s.teach.join(' ') + ' ' + s.example).split(/\s+/).length).toBeGreaterThanOrEqual(90); }
    expect(s.practice.length).toBeGreaterThanOrEqual(1);
    expect(s.checks.length).toBeGreaterThanOrEqual(s.kind === 'checkpoint' ? 3 : 2);
    for (const c of s.checks) { expect(c.options.length).toBeGreaterThanOrEqual(3); expect(c.answer).toBeGreaterThanOrEqual(0); expect(c.answer).toBeLessThan(c.options.length); expect(c.why.length).toBeGreaterThan(5); }
    expect(s.claimIds.length).toBeGreaterThan(0);
    for (const c of s.claimIds) expect(claimIds.has(c)).toBe(true);
  });
  it('item ids are unique', () => { const ids = SESSIONS.flatMap(s => s.checks.map(c => c.id)); expect(new Set(ids).size).toBe(ids.length); });
});

describe('scenario gym completeness', () => {
  it('has at least 36 scenarios and 6 per category', () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(36);
    for (const c of Object.keys(CATEGORY_LABELS)) expect(SCENARIOS.filter(s => s.category === c).length).toBeGreaterThanOrEqual(6);
  });
  it('covers both everyday and professional contexts', () => {
    expect(SCENARIOS.filter(s => s.context === 'everyday').length).toBeGreaterThanOrEqual(12);
    expect(SCENARIOS.filter(s => s.context === 'professional').length).toBeGreaterThanOrEqual(12);
  });
  it.each(SCENARIOS.map(s => [s.id, s] as const))('scenario %s is well formed', (_id, s) => {
    expect(s.facts.length).toBeGreaterThan(0); expect(s.interpretations.length).toBeGreaterThan(0);
    expect(s.plausibleEmotions.every(i => i < s.emotionOptions.length)).toBe(true);
    expect(s.responses.length).toBeGreaterThanOrEqual(3);
    expect(s.responses.some(r => r.quality === 2)).toBe(true);
    for (const c of s.claimIds) expect(claimIds.has(c)).toBe(true);
  });
});

describe('research integrity', () => {
  it('every source has a DOI, Crossref verification and at least one claim', () => {
    for (const s of SOURCES) { expect(s.doi).toMatch(/^10\./); expect(s.verified).toBe('crossref-metadata'); expect(s.claims.length).toBeGreaterThan(0); }
  });
  it('every source claim is used somewhere', () => {
    const used = new Set([...SESSIONS.flatMap(s => s.claimIds), ...SCENARIOS.flatMap(s => s.claimIds)]);
    for (const id of claimIds) expect(used.has(id), id).toBe(true);
  });
  it('content avoids prohibited claims', () => {
    const txt = all.join(' ').toLowerCase();
    for (const bad of ['clinically proven', 'scientifically validated', 'cure ', 'guaranteed']) expect(txt).not.toContain(bad);
  });
  it('user-facing content avoids em dashes', () => { expect(all.join(' ')).not.toContain('\u2014'); });
  it('assessment items are present and original', () => { expect(SELF_RATING_ITEMS.length).toBe(8); expect(SJT_ITEMS.length).toBe(8); });
});

import { DEEP } from '../../src/content/enrich';
import { BRANCHES, TRANSFER } from '../../src/content/scenarioExtra';
import { KNOWLEDGE_ITEMS, GOALS } from '../../src/content/measures';
import { SPEC_CATEGORIES } from './spec';

const LEARN = SESSIONS.filter(s => s.kind === 'lesson' || s.kind === 'practice');
const words = (t: string) => t.split(/\s+/).filter(Boolean).length;
describe('deepening pass: session depth (spec 5.3)', () => {
  it('every lesson/practice session has authored deep content', () => { for (const s of LEARN) expect(DEEP[s.id], s.id).toBeTruthy(); });
  it.each(SESSIONS.map(s => [s.id, s] as const))('session %s meets depth rules', (_id, s) => {
    // Layer 1: activity (or a documented exemption for checkpoint/review)
    if (s.kind === 'lesson' || s.kind === 'practice') {
      expect(s.activity).toBeTruthy();
      expect(words(s.teach.join(' ') + ' ' + (s.example ?? '')), 'teaching + example words').toBeGreaterThanOrEqual(150);
      expect(s.altChecks.length, 'alternative mastery item').toBeGreaterThanOrEqual(1);
    } else expect(s.activityExempt, 'exemption reason').toMatch(/assessment/);
    const a = s.activity;
    if (a) {
      if (a.type === 'classify') { expect(a.items.length).toBeGreaterThanOrEqual(4); expect(new Set(a.items.map(i => i.bucket)).size).toBeGreaterThanOrEqual(2); for (const i of a.items) { expect(i.fb.length).toBeGreaterThan(8); expect(i.bucket).toBeLessThan(a.buckets.length); } }
      if (a.type === 'sequence') { expect(a.steps.length).toBeGreaterThanOrEqual(4); for (const i of a.steps) expect(i.fb.length).toBeGreaterThan(8); }
      if (a.type === 'match') { expect(a.pairs.length).toBeGreaterThanOrEqual(4); expect(new Set(a.pairs.map(p => p.right)).size).toBe(a.pairs.length); for (const i of a.pairs) expect(i.fb.length).toBeGreaterThan(8); }
      if (a.type === 'predict' || a.type === 'compare') { expect(a.options.length).toBeGreaterThanOrEqual(3); expect(a.options.filter(o => o.good).length).toBe(1); for (const o of a.options) expect(o.fb.length, 'per-option feedback').toBeGreaterThan(8); }
    }
    // Layer 2: explanation-back in every session, with model key points
    expect(s.explain.prompt.length).toBeGreaterThan(30); expect(s.explain.keyPoints.length).toBeGreaterThanOrEqual(3);
    // Application, prerequisites, duration
    expect(s.apply.length).toBeGreaterThan(30);
    if (s.id !== 'w01d1') expect(s.prerequisites.length).toBeGreaterThan(0);
    // Duration is a range derived from measured content (duration.ts); the upper end must stay within the spec's 30-minute ceiling.
    expect(s.range[0], 'quick end').toBeGreaterThanOrEqual(2); expect(s.range[1]).toBeGreaterThan(s.range[0]); expect(s.range[1]).toBeLessThanOrEqual(30); expect(s.minutes).toBe(s.range[1]);
    for (const c of s.altChecks) { expect(c.options.length).toBeGreaterThanOrEqual(3); expect(c.answer).toBeLessThan(c.options.length); expect(c.why.length).toBeGreaterThan(5); }
  });
  it('activity types are varied across the programme', () => {
    const types = new Set(LEARN.map(s => s.activity!.type)); for (const t of ['classify', 'sequence', 'match', 'predict', 'compare']) expect(types.has(t as never), t).toBe(true);
  });
  it('no duplicated teaching paragraphs or explain prompts', () => {
    const paras = LEARN.flatMap(s => s.teach); expect(new Set(paras).size).toBe(paras.length); // checkpoints share one standard pool explanation
    const prompts = LEARN.map(s => s.explain.prompt); expect(new Set(prompts).size).toBe(prompts.length);
  });
  it('all item ids including alternatives are unique', () => { const ids = SESSIONS.flatMap(s => [...s.checks, ...s.altChecks].map(c => c.id)); expect(new Set(ids).size).toBe(ids.length); });
  it('each checkpoint has an alternative pool larger than one attempt', () => {
    for (const s of SESSIONS.filter(x => x.kind === 'checkpoint')) {
      const pool = SESSIONS.filter(x => x.phase === s.phase).flatMap(x => [...x.checks, ...x.altChecks]); expect(pool.length, s.id).toBeGreaterThan(8);
    }
  });
});
describe('deepening pass: scenarios (spec 7)', () => {
  it('categories match spec 7.1 with at least 6 each', () => {
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual(Object.keys(SPEC_CATEGORIES).sort());
    for (const [k, v] of Object.entries(SPEC_CATEGORIES)) { expect(CATEGORY_LABELS[k as keyof typeof CATEGORY_LABELS]).toBe(v); expect(SCENARIOS.filter(s => s.category === k).length).toBeGreaterThanOrEqual(6); }
  });
  it('every response option has feedback; difficulty set; transfer question per category', () => {
    for (const s of SCENARIOS) { expect([1, 2, 3]).toContain(s.difficulty); for (const r of s.responses) expect(r.feedback.length).toBeGreaterThan(8); expect(TRANSFER[s.category].length).toBeGreaterThan(20); }
    for (const d of [1, 2, 3]) expect(SCENARIOS.filter(s => s.difficulty === d).length).toBeGreaterThanOrEqual(6);
  });
  it('branching follow-ups: one outcome per first choice, options with trade-off feedback, at least one per category', () => {
    for (const [id, b] of Object.entries(BRANCHES)) { const s = SCENARIOS.find(x => x.id === id)!; expect(b.next.length, id).toBe(s.responses.length); expect(b.options.some(o => o.quality === 2)).toBe(true); for (const o of b.options) expect(o.feedback.length).toBeGreaterThan(20); }
    for (const c of Object.keys(CATEGORY_LABELS)) expect(SCENARIOS.some(s => s.category === c && s.followUp), c).toBe(true);
  });
});
describe('deepening pass: assessments (spec 9)', () => {
  it('baseline has goals, knowledge items separate from lesson items', () => {
    expect(GOALS.length).toBeGreaterThanOrEqual(5); expect(KNOWLEDGE_ITEMS.length).toBeGreaterThanOrEqual(6);
    const lessonQs = new Set(SESSIONS.flatMap(s => [...s.checks, ...s.altChecks].map(c => c.q))); for (const k of KNOWLEDGE_ITEMS) expect(lessonQs.has(k.q)).toBe(false);
  });
  it('new content avoids prohibited claims and em dashes', () => {
    const txt = JSON.stringify([DEEP, BRANCHES, TRANSFER, KNOWLEDGE_ITEMS]);
    for (const bad of ['clinically proven', 'scientifically validated', 'cure ', 'guaranteed']) expect(txt.toLowerCase()).not.toContain(bad);
    expect(txt).not.toContain('\u2014');
  });
});

describe('scenarios in context', () => {
  it('every lesson and practice session has at least one scenario authored for its exact skill', async () => {
    const { SESSIONS } = await import('../../src/content/sessions');
    const { SCENARIOS } = await import('../../src/content/scenarios');
    const { SOURCES } = await import('../../src/content/sources');
    const missing = SESSIONS.filter(s => (s.kind === 'lesson' || s.kind === 'practice') && !SCENARIOS.some(x => x.skill === s.title)).map(s => s.id);
    expect(missing).toEqual([]);
    const claims = new Set(SOURCES.flatMap(s => s.claims.map(c => c.id)));
    for (const x of SCENARIOS) for (const c of x.claimIds) expect(claims.has(c), `${x.id} ${c}`).toBe(true);
  });
});
