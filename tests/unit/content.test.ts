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
