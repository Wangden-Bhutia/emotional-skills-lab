import { describe, expect, it } from 'vitest';
import { SESSIONS } from '../../src/content/sessions';
import { DEEP, contentCounts, CHECKPOINT_DRAW } from '../../src/content/enrich';
import { durationRange, RATES } from '../../src/content/duration';
import { MEASURED } from '../../src/content/durations';

describe('session durations come from the measured walk-through', () => {
  it('every session has a measured entry', () => {
    expect(SESSIONS.filter(s => !s.estimate.measured).map(s => s.id)).toEqual([]);
    expect(Object.keys(MEASURED.sessions).length).toBe(SESSIONS.length);
  });
  it('measurements are not stale: rendered words track authored content (UI chrome adds 0-100%)', () => {
    for (const s of SESSIONS) {
      const assess = s.kind === 'checkpoint' || s.kind === 'review';
      const c = contentCounts(s, DEEP[s.id], s.teach, assess ? CHECKPOINT_DRAW : s.checks.length, s.explain.prompt + ' ' + s.explain.keyPoints.join(' ') + ' ' + s.explain.keyPoints.join(' ') + ' ' + s.apply);
      const ratio = s.estimate.words / c.words;
      expect(ratio, s.id + ' re-run MEASURE=1 after content edits').toBeGreaterThanOrEqual(1); expect(ratio, s.id).toBeLessThanOrEqual(2);
    }
  });
  it('range follows the documented model', () => {
    expect(durationRange({ words: 520, interactions: 0, quizItems: 0, quizWords: 0, explain: false })).toEqual([3, 6]);
    expect(RATES.wpmSlow).toBeLessThan(RATES.wpmFast);
  });
});
