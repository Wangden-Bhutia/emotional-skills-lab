import { describe, expect, it } from 'vitest';
import { SESSIONS } from '../../src/content/sessions';
import { SJT_ITEMS, KNOWLEDGE_ITEMS, POST_KNOWLEDGE_ITEMS, POST_SJT_ITEMS } from '../../src/content/measures';
import { DISTRACTORS } from '../../src/content/distractors';

const ITEMS = [...SESSIONS.flatMap(s => [...s.checks, ...s.altChecks]), ...SJT_ITEMS, ...KNOWLEDGE_ITEMS, ...POST_KNOWLEDGE_ITEMS, ...POST_SJT_ITEMS];
/** Words that make a wrong option obviously wrong without any knowledge of the lesson. */
export const GIVEAWAY = /\b(always|never|nothing useful|nothing at all|forever|everyone|no one|quit|scream\w*|random|randomly|harshest|punish\w*|hate|stupid|insult\w*|rage|sabotage|gossip|banned|weather|weekends?|lie to yourself)\b/i;
const words = (t: string) => t.trim().split(/\s+/).length;

/** Heuristic distractor-quality check; returns reasons a distractor looks implausible. */
export function distractorProblems(correct: string, d: string): string[] {
  const p: string[] = [];
  if (GIVEAWAY.test(d)) p.push('giveaway word');
  if (words(d) === 1 && words(correct) > 3) p.push('one-word distractor next to a longer answer');
  if (d.length < correct.length * 0.35) p.push('much shorter than the answer (length cue)');
  return p;
}

describe('quiz distractors (heuristic)', () => {
  it('every item has rewritten distractors', () => {
    expect(ITEMS.filter(i => !DISTRACTORS[i.id]).map(i => i.id)).toEqual([]);
  });
  it('no distractor is a giveaway: extreme word, lone word next to a sentence, or a strong length cue', () => {
    const bad = ITEMS.flatMap(i => i.options.flatMap((o, k) => k === i.answer ? [] : distractorProblems(i.options[i.answer], o).map(r => `${i.id}: "${o}" (${r})`)));
    expect(bad).toEqual([]);
  });
  it('options are distinct and the correct answer is not systematically the longest', () => {
    for (const i of ITEMS) expect(new Set(i.options).size, i.id).toBe(i.options.length);
    const longest = ITEMS.filter(i => i.options.every((o, k) => k === i.answer || o.length < i.options[i.answer].length)).length;
    expect(longest / ITEMS.length).toBeLessThan(0.75);
  });
  it('the heuristic catches the kinds of distractor it is meant to catch', () => {
    expect(distractorProblems('Thinking clearly while feeling', 'Shouting')).not.toEqual([]);
    expect(distractorProblems('How your work is perceived', 'To quit')).not.toEqual([]);
    expect(distractorProblems('Name likely emotions', 'Pick the harshest')).not.toEqual([]);
    expect(distractorProblems('Cognitive change', 'Response modulation')).toEqual([]);
  });
});
