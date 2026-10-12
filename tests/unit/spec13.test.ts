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

import { COMPETENCIES, EVIDENCE_RULE } from '../../src/content/competencies';
import { TOPICS } from '../../src/content/topics';
import { SKILL_SESSIONS, retentionItems } from '../../src/engine/state';
import { KNOWLEDGE_ITEMS, SJT_ITEMS, POST_KNOWLEDGE_ITEMS, POST_SJT_ITEMS } from '../../src/content/measures';

describe('6.L3b competency statements', () => {
  it('every skill has a written competency statement and the shared evidence rule is explicit', () => {
    for (const s of SKILL_SESSIONS) { expect(COMPETENCIES[s.id], s.id).toBeTruthy(); expect(COMPETENCIES[s.id]).toMatch(/^(Given .+, you can |You can )/); }
    expect(Object.keys(COMPETENCIES).sort()).toEqual(SKILL_SESSIONS.map(s => s.id).sort());
    expect(EVIDENCE_RULE).toMatch(/80%/); expect(EVIDENCE_RULE).toMatch(/design choice/);
  });
  it('competency statements are shown in the UI', () => { expect(viewsSrc).toContain('COMPETENCIES[s.id]'); });
});

describe('5.2 thin sub-topics deepened without padding or extra sessions', () => {
  it('each topic block is substantive, has a scored item, and sessions stay at 60 within 30 minutes', () => {
    expect(SESSIONS).toHaveLength(60);
    for (const [id, t] of Object.entries(TOPICS)) {
      const s = SESSIONS.find(x => x.id === id)!; expect(s, id).toBeTruthy();
      expect(t.teach.join(' ').split(/\s+/).length, id).toBeGreaterThanOrEqual(150);
      for (const p of t.teach) expect(s.teach).toContain(p);
      expect(s.checks.some(c => c.q === t.check[0])).toBe(true);
      expect(s.minutes).toBeLessThanOrEqual(30);
    }
    for (const p of ['P1', 'P4', 'P5', 'P6', 'P7', 'P8']) expect(Object.values(TOPICS).some(t => t.spec.startsWith(p)), p).toBe(true);
  });
});

describe('7.2c plausible options', () => {
  it('no decision has more than one option rated "likely to backfire", and each has a partial or second strong option', () => {
    for (const s of SCENARIOS) for (const opts of [s.responses, s.followUp?.options ?? []]) {
      if (!opts.length) continue;
      expect(opts.filter(o => o.quality === 0).length, s.id).toBeLessThanOrEqual(1);
      expect(opts.some(o => o.quality === 1) || opts.filter(o => o.quality === 2).length > 1, s.id).toBe(true);
    }
  });
});

const VAGUE = /\b(stay(ing)? calm|keep calm|be mindful|think positive(ly)?|just relax|calm down|don'?t worry|let it go|be positive|stay positive)\b/i;
const SPECIFIC = /\d|for example|such as|\bby\b|:|\bthen\b|\bbut\b|\bnot\b|\bwithout\b/i;
/** A sentence with a vague phrase passes only if it adds specifics or contrasts it, or it is an option being critiqued. */
export function vagueSentences(texts: string[]): string[] {
  return texts.flatMap(t => t.split(/(?<=[.!?])\s+/)).filter(x => VAGUE.test(x) && !SPECIFIC.test(x));
}
describe('5.3b vague-advice check', () => {
  it('the checker flags vague advice and accepts specific advice', () => {
    expect(vagueSentences(['Stay calm and be mindful.', 'Think positively.'])).toHaveLength(2);
    expect(vagueSentences(['Stay calm by breathing out for 6 seconds.', 'Calming down is not the same as giving in.'])).toHaveLength(0);
  });
  it('no session content or best-rated scenario option gives vague advice', () => {
    const texts = [...SESSIONS.flatMap(s => [s.objective, ...s.teach, s.example ?? '', ...s.practice, s.reflect, s.apply, ...s.explain.keyPoints, ...s.checks.map(c => c.why)]),
      ...SCENARIOS.flatMap(s => [s.situation, ...[...s.responses, ...(s.followUp?.options ?? [])].flatMap(o => o.quality === 2 ? [o.text, o.feedback, o.tradeoff!.fits] : [o.feedback])])];
    expect(vagueSentences(texts)).toEqual([]);
  });
});

describe('8.2 post-programme items and retention', () => {
  it('post items are new: not baseline items and not lesson items', () => {
    const base = new Set([...KNOWLEDGE_ITEMS, ...SJT_ITEMS].map(i => i.q));
    const lesson = new Set(SESSIONS.flatMap(s => [...s.checks, ...s.altChecks]).map(i => i.q));
    for (const i of [...POST_KNOWLEDGE_ITEMS, ...POST_SJT_ITEMS]) { expect(base.has(i.q), i.id).toBe(false); expect(lesson.has(i.q), i.id).toBe(false); expect(i.answer).toBeLessThan(i.options.length); }
    expect(POST_KNOWLEDGE_ITEMS.length).toBe(KNOWLEDGE_ITEMS.length); expect(POST_SJT_ITEMS.length).toBe(SJT_ITEMS.length);
  });
  it('retention draws only from completed earlier-phase lessons, deterministically', () => {
    let st = emptyState();
    for (const s of SESSIONS.filter(x => x.phase <= 3)) st = completeSession(st, s.id, {}, 1);
    const r = retentionItems(st); expect(r).toHaveLength(6);
    const allowed = new Set(SKILL_SESSIONS.filter(s => s.phase <= 3).flatMap(s => [...s.checks, ...s.altChecks].map(c => c.id)));
    for (const i of r) expect(allowed.has(i.id)).toBe(true);
    expect(retentionItems(st).map(i => i.id)).toEqual(r.map(i => i.id));
    expect(new Set(r.map(i => ITEM_SKILL[i.id])).size).toBe(r.length);
  });
});
