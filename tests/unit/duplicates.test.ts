import { describe, expect, it } from 'vitest';
import { SESSIONS } from '../../src/content/sessions';
import { nearDuplicates, similarity } from '../../src/content/dupcheck';

describe('lesson text has no near-duplicate paragraphs or sentences', () => {
  it('no two sentences in different paragraphs of a lesson say nearly the same thing', () => {
    const bad = SESSIONS.flatMap(s => nearDuplicates(s.teach, 0.6).map(d => `${s.id}: "${d.a}" ~ "${d.b}" (${d.score})`));
    expect(bad).toEqual([]);
  });
  it('no paragraph is mostly contained in another paragraph of the same lesson', () => {
    const bad: string[] = [];
    for (const s of SESSIONS) s.teach.forEach((a, i) => s.teach.forEach((b, j) => { if (j > i && similarity(a, b) >= 0.65) bad.push(`${s.id} paragraphs ${i}/${j}`); }));
    expect(bad).toEqual([]);
  });
  it('the detector flags a reworded repeat', () => {
    expect(nearDuplicates(['Seeking support is a skill, not a failure.', 'Seeking help is a skill, not a failure.'], 0.6)).toHaveLength(1);
    expect(nearDuplicates(['Anger signals an obstacle.', 'Breathing slowly lowers arousal before a meeting.'], 0.6)).toHaveLength(0);
  });
});
