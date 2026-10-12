/** Automated checks named in spec section 13 that were not already covered elsewhere. */
import { describe, expect, it } from 'vitest';
import viewsSrc from '../../src/ui/views.tsx?raw';
import indexSrc from '../../index.html?raw';
import { SESSIONS } from '../../src/content/sessions';
import { SCENARIOS, CATEGORY_LABELS } from '../../src/content/scenarios';
import { SOURCES } from '../../src/content/sources';
import { EVIDENCE } from '../../src/content/evidence';
import { checkpointItems, remediationFor, emptyState, completeSession, ITEM_SKILL, MASTERY_THRESHOLD } from '../../src/engine/state';

const options = (s: (typeof SCENARIOS)[number]) => [...s.responses, ...(s.followUp?.options ?? [])];
describe('13.1 curriculum and scenario checks', () => {
  it('prerequisites and remediation links resolve to real sessions', () => {
    const ids = new Set(SESSIONS.map(s => s.id));
    for (const s of SESSIONS) for (const p of s.prerequisites) expect(ids.has(p), `${s.id} -> ${p}`).toBe(true);
    for (const id of Object.values(ITEM_SKILL)) expect(ids.has(id)).toBe(true);
  });
  it('no placeholder text is presented as finished content', () => {
    const txt = JSON.stringify([SESSIONS, SCENARIOS, SOURCES]).toLowerCase();
    for (const bad of ['lorem', 'todo', 'tbd', 'placeholder', 'xxx', 'fixme']) expect(txt, bad).not.toContain(bad);
  });
  it('every scenario option (first and follow-up) has feedback and trade-offs (protects, costs, fits)', () => {
    for (const s of SCENARIOS) for (const o of options(s)) {
      expect(o.feedback.length, s.id).toBeGreaterThan(8);
      expect(o.tradeoff, `${s.id}: ${o.text}`).toBeTruthy();
      for (const k of ['protects', 'costs', 'fits'] as const) expect(o.tradeoff![k].length, `${s.id} ${k}`).toBeGreaterThan(3);
    }
  });
  it('at least 3 options per decision and no single obviously virtuous answer against two absurd ones in most scenarios', () => {
    for (const s of SCENARIOS) { expect(s.responses.length).toBeGreaterThanOrEqual(3); if (s.followUp) expect(s.followUp.options.length).toBeGreaterThanOrEqual(3); }
    const mixed = SCENARIOS.filter(s => s.responses.some(r => r.quality === 1)).length;
    expect(mixed / SCENARIOS.length).toBeGreaterThan(0.75);
  });
  it('most scenarios branch, with one consequence per first choice, in every category', () => {
    const br = SCENARIOS.filter(s => s.followUp);
    expect(br.length).toBeGreaterThanOrEqual(25);
    for (const s of br) expect(s.followUp!.next.length).toBe(s.responses.length);
    for (const c of Object.keys(CATEGORY_LABELS)) expect(br.filter(s => s.category === c).length, c).toBeGreaterThanOrEqual(3);
  });
  it('scoring is deterministic: the same attempt draws the same checkpoint items', () => {
    const cp = SESSIONS.find(s => s.kind === 'checkpoint' && s.phase === 2)!;
    expect(checkpointItems(emptyState(), cp.id).map(i => i.id)).toEqual(checkpointItems(emptyState(), cp.id).map(i => i.id));
  });
});

describe('12 safety', () => {
  const safety = SCENARIOS.filter(s => s.safety);
  it('has threat, coercion and harassment scenarios', () => { expect(safety.length).toBeGreaterThanOrEqual(4); });
  it.each(safety.map(s => [s.id, s] as const))('%s rates the safety/boundary/support option highest and never rates tolerating or silence as skilful', (_id, s) => {
    for (const o of options(s)) {
      if (/(take it quietly|keep being friendly|laugh along|handle all future calls alone|try harder to be perfect|withdraw your complaint)/i.test(o.text)) expect(o.quality, o.text).toBeLessThan(2);
    }
    const best = s.responses.filter(r => r.quality === 2);
    expect(best.length).toBeGreaterThan(0);
    for (const r of best) expect(r.text.toLowerCase()).toMatch(/report|hr|manager|leave|safe|record|step back|support/);
  });
  it('safety feedback never blames the learner for others\' behaviour', () => {
    const txt = JSON.stringify(safety.map(options)).toLowerCase();
    for (const bad of ['is your fault', 'was your fault', 'you provoked', 'you caused them', 'just tolerate']) expect(txt).not.toContain(bad);
  });
});

describe('13.2 assessment checks', () => {
  it('wrong answers trigger remediation to the teaching session', () => {
    const s = SESSIONS.find(x => x.id === 'w02d1')!; expect(remediationFor({ [s.checks[0].id]: false })).toEqual(['w02d1']);
  });
  it('repeated attempts append history and do not corrupt records', () => {
    let st = emptyState(); const id = 'w01d1'; const r = Object.fromEntries(SESSIONS[0].checks.map(c => [c.id, true]));
    st = completeSession(st, id, r, 1); st = completeSession(st, id, r, 2);
    expect(Object.keys(st.completed)).toEqual([id]); expect(st.itemLog![SESSIONS[0].checks[0].id]).toHaveLength(2);
  });
  it('threshold is described as a design choice, not clinically validated', () => {
    expect(MASTERY_THRESHOLD).toBe(0.8);
    const src = viewsSrc;
    expect(src).toMatch(/design choice/); expect(src.toLowerCase()).not.toContain('clinically validated');
    expect(src).toMatch(/does not grade/);
  });
});

describe('13.3 research checks', () => {
  it('every source has register metadata with a use label and limitations', () => {
    for (const s of SOURCES) { const e = EVIDENCE[s.id]; expect(e, s.id).toBeTruthy(); expect(['direct', 'extrapolation', 'background']).toContain(e.use); expect(e.limitations.length).toBeGreaterThan(10); }
  });
  it('suggested references from the brief are present with their DOIs where they resolved', () => {
    const dois = new Set(SOURCES.map(s => s.doi.toLowerCase()));
    for (const d of ['10.1037/1089-2680.2.3.271', '10.1080/1047840x.2014.940781', '10.2196/31170', '10.1038/s44184-023-00048-5']) expect(dois.has(d), d).toBe(true);
  });
  it('UI and onboarding make no efficacy claims about this app', () => {
    const src = (viewsSrc + indexSrc).toLowerCase();
    for (const bad of ['proven to', 'clinically proven', 'scientifically validated', 'will improve your', 'guaranteed']) expect(src).not.toContain(bad);
  });
});
