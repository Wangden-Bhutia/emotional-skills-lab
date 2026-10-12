import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../../src/content/scenarios';

const decisions = SCENARIOS.flatMap(s => [{ id: `${s.id} first`, s, opts: s.responses }, ...(s.followUp ? [{ id: `${s.id} follow-up`, s, opts: s.followUp.options }] : [])]);
const sentences = (t: string) => t.split(/(?<=[.!?])\s+/).filter(x => x.trim().length > 3).length;

describe('scenario feedback quality', () => {
  it('every option has substantive feedback: at least 80 characters and 1 to 3 sentences', () => {
    const bad = decisions.flatMap(d => d.opts.filter(o => o.feedback.length < 80 || sentences(o.feedback) > 3 || sentences(o.feedback) < 1).map(o => `${d.id}: "${o.feedback}"`));
    expect(bad).toEqual([]);
  });
  it('feedback is specific to the option, not a shared stock phrase', () => {
    const all = decisions.flatMap(d => d.opts.map(o => o.feedback));
    expect(new Set(all).size).toBe(all.length);
  });
  it('every decision has a plausible second-best option (rated partly effective) alongside the best', () => {
    expect(decisions.filter(d => !d.opts.some(o => o.quality === 1) || !d.opts.some(o => o.quality === 2)).map(d => d.id)).toEqual([]);
  });
  it('safety scenarios never rate complying under coercion or staying quiet under threat as the lowest option', () => {
    const comply = /keep being friendly|take it quietly|withdraw your complaint|hand over money|laugh along|handle all future calls alone/i;
    for (const s of SCENARIOS.filter(x => x.safety)) for (const o of [...s.responses, ...(s.followUp?.options ?? [])])
      if (comply.test(o.text)) { expect(o.quality, `${s.id}: ${o.text}`).toBeGreaterThanOrEqual(1); expect(o.feedback).not.toMatch(/backfire|your fault|should have/i); }
  });
});
