import { describe, expect, it } from 'vitest';
import { SESSIONS } from '../../src/content/sessions';
import { answerReview, completeSession, dueReviews, emptyState, exportData, followupDue, importData, isUnlocked, metrics, nextSession, phaseMastered, MASTERY_THRESHOLD } from '../../src/engine/state';
import { IDBStorage, MemoryStorage } from '../../src/storage/storage';
import { loadState, saveState, deleteAll } from '../../src/storage/repo';
const DAY = 86400000;
const allRight = (id: string) => Object.fromEntries(SESSIONS.find(s => s.id === id)!.checks.map(c => [c.id, true]));
const allWrong = (id: string) => Object.fromEntries(SESSIONS.find(s => s.id === id)!.checks.map(c => [c.id, false]));
const doWeek1 = (right = true) => { let s = emptyState(); for (const id of ['w01d1', 'w01d2', 'w01d3', 'w01d4']) s = completeSession(s, id, allRight(id), 0); return completeSession(s, 'w01d5', right ? allRight('w01d5') : allWrong('w01d5'), 0); };

describe('engine', () => {
  it('unlocks sequentially', () => {
    const s = emptyState(); expect(isUnlocked(s, 'w01d1')).toBe(true); expect(isUnlocked(s, 'w01d2')).toBe(false);
    expect(isUnlocked(completeSession(s, 'w01d1', {}), 'w01d2')).toBe(true); expect(nextSession(s)!.id).toBe('w01d1');
  });
  it('completion does not imply mastery', () => {
    const s = doWeek1(false); expect(metrics(s).completion).toBeCloseTo(5 / 60); expect(phaseMastered(s, 1)).toBe(false); expect(Object.keys(s.items)).toHaveLength(0);
  });
  it('mastery at threshold schedules spaced reviews', () => {
    expect(MASTERY_THRESHOLD).toBe(0.8);
    const s = doWeek1(); expect(phaseMastered(s, 1)).toBe(true);
    expect(dueReviews(s, 1 * DAY)).toHaveLength(0); expect(dueReviews(s, 2 * DAY).length).toBe(11);
  });
  it('2 of 3 on a checkpoint (67%) is not mastery', () => {
    const r = allRight('w01d5'); r[Object.keys(r)[0]] = false;
    let s = emptyState(); s = completeSession(s, 'w01d5', r); expect(phaseMastered(s, 1)).toBe(false);
  });
  it('retention: correct advances interval, wrong resets', () => {
    let s = doWeek1(); const id = dueReviews(s, 2 * DAY)[0];
    s = answerReview(s, id, true, 2 * DAY); expect(s.items[id].stage).toBe(1); expect(s.items[id].due).toBe(9 * DAY);
    s = answerReview(s, id, false, 9 * DAY); expect(s.items[id].stage).toBe(0); expect(s.items[id].due).toBe(11 * DAY);
    expect(metrics(s).retention).toBe(0.5);
  });
  it('follow-up due 30 days after post', () => {
    const s = emptyState(); s.assessments.push({ kind: 'post', at: 0, selfRatings: [], sjtCorrect: 0, sjtTotal: 8 });
    expect(followupDue(s, 29 * DAY)).toBe(false); expect(followupDue(s, 30 * DAY)).toBe(true);
  });
  it('export and import round-trip; bad files rejected', () => {
    const s = doWeek1(); s.journal.push({ id: 'j', at: 1, type: 'checkin', emotions: [{ name: 'Calm', intensity: 3 }] });
    expect(importData(exportData(s))).toEqual(s);
    expect(() => importData('{"app":"other"}')).toThrow(); expect(() => importData('not json')).toThrow();
    expect(() => importData(JSON.stringify({ app: 'emotional-skills-lab', state: { ...s, schema: 99 } }))).toThrow(/version/);
  });
});

describe.each([['memory', () => new MemoryStorage()], ['indexeddb', () => new IDBStorage('test-' + Math.random())]])('storage %s', (_n, mk) => {
  it('saves, loads and deletes state', async () => {
    const st = mk(); expect((await loadState(st)).journal).toEqual([]);
    const s = doWeek1(); await saveState(st, s); expect(await loadState(st)).toEqual(s);
    await deleteAll(st); expect(await st.keys()).toEqual([]);
  });
});
