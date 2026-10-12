import { describe, expect, it } from 'vitest';
import { emptyState, completeSession, SCHEMA_VERSION, type AppState } from '../../src/engine/state';
import { migrate, importData, exportData, mergeStates, DataError, MIGRATIONS, validate } from '../../src/engine/data';
import { MemoryStorage, IDBStorage, DB_VERSION } from '../../src/storage/storage';
import { loadStateSafe, KEY, CORRUPT_PREFIX, backupBeforeImport, readPreImportBackup } from '../../src/storage/repo';
import { SESSIONS } from '../../src/content/sessions';

const v1 = (): Record<string, unknown> => { const s = emptyState() as unknown as Record<string, unknown>; delete s.meta; return { ...s, schema: 1, journal: [{ id: 'a', at: 1, type: 'checkin', emotions: [{ name: 'Anger', intensity: 7 }] }] }; };
const right = (id: string) => Object.fromEntries(SESSIONS.find(s => s.id === id)!.checks.map(c => [c.id, true]));

describe('schema migrations (spec 10.4)', () => {
  it('current schema is 3 and every older version has a migration', () => { expect(SCHEMA_VERSION).toBe(3); for (let v = 1; v < SCHEMA_VERSION; v++) expect(MIGRATIONS[v], `migration ${v}`).toBeTypeOf('function'); });
  it('migrates v1 data to v3 without losing records', () => {
    const s = migrate(v1()); expect(s.schema).toBe(3); expect(s.journal).toHaveLength(1); expect(s.meta?.migratedFrom).toEqual([1, 2]);
  });
  it('rejects data from a newer app version rather than guessing', () => { expect(() => migrate({ ...v1(), schema: 99 })).toThrow(/newer version/); });
  it('rejects data with missing collections', () => { const x = v1(); delete x.journal; expect(() => migrate(x)).toThrow(DataError); });
  it('normalises invalid score ranges and duplicate records', () => {
    const x = { ...v1(), phaseResults: { 1: [{ at: 1, score: 7, mastered: true }, { at: 2, score: -1, mastered: false }] },
      journal: [{ id: 'a', at: 1, type: 'checkin', emotions: [{ name: 'Fear', intensity: 99 }] }, { id: 'a', at: 2, type: 'checkin', emotions: [] }],
      scenarios: [{ scenarioId: 'sc01', at: 5, quality: 2 }, { scenarioId: 'sc01', at: 5, quality: 2 }, { scenarioId: 'sc02', at: 6, quality: 9 }],
      assessments: [{ kind: 'baseline', at: 1, sjtCorrect: 9, sjtTotal: 8, selfRatings: [] }] };
    const s = migrate(x);
    expect(s.phaseResults[1].map(r => r.score)).toEqual([1, 0]);
    expect(s.journal).toHaveLength(1); expect(s.journal[0].emotions[0].intensity).toBe(10);
    expect(s.scenarios).toHaveLength(1); expect(s.assessments).toHaveLength(0);
  });
});

describe('schema 2 -> 3 journal migration (spec 9.7)', () => {
  const v2 = () => ({ ...v1(), schema: 2, journal: [
    { id: 'r1', at: 1, type: 'reflection', emotions: [], trigger: 'Meeting', outcome: 'They apologised later' },
    { id: 'r2', at: 2, type: 'reflection', emotions: [], next: 'Already new', outcome: 'kept' },
    { id: 'c1', at: 3, type: 'checkin', emotions: [] }] });
  it('moves "outcome" into the new "What happened next?" field', () => {
    const s = migrate(v2()); expect(s.schema).toBe(3);
    expect(s.journal.find(e => e.id === 'r1')).toMatchObject({ next: 'They apologised later' }); expect(s.journal.find(e => e.id === 'r1')!.outcome).toBeUndefined();
  });
  it('does not overwrite an existing "next" value and leaves other entries alone', () => {
    const s = migrate(v2()); expect(s.journal.find(e => e.id === 'r2')).toMatchObject({ next: 'Already new', outcome: 'kept' }); expect(s.journal.find(e => e.id === 'c1')!.next).toBeUndefined();
  });
  it('is idempotent once at v3', () => { const s = migrate(v2()); expect(migrate(s)).toEqual(s); });
});

describe('corrupt-data recovery (spec 10.4)', () => {
  it('keeps unreadable data under a separate key and starts fresh with a notice', async () => {
    const m = new MemoryStorage(); await m.set(KEY, { garbage: true });
    const r = await loadStateSafe(m, 123);
    expect(r.recovered).toMatch(/kept on this device/); expect(r.state.schema).toBe(SCHEMA_VERSION);
    expect(await m.get(`${CORRUPT_PREFIX}123`)).toEqual({ garbage: true });
  });
  it('upgrades stored v1 data on load and writes it back', async () => {
    const m = new MemoryStorage(); await m.set(KEY, v1());
    const r = await loadStateSafe(m); expect(r.migrated).toBe(true); expect((await m.get<AppState>(KEY))!.schema).toBe(3);
  });
  it('empty storage gives a fresh state without a notice', async () => { const r = await loadStateSafe(new MemoryStorage()); expect(r.recovered).toBeUndefined(); });
  it('IndexedDB adapter has an explicit version and round-trips data', async () => {
    expect(DB_VERSION).toBe(1); const db = new IDBStorage('test-db-' + Math.random()); await db.set(KEY, v1()); expect((await loadStateSafe(db)).state.schema).toBe(3);
  });
});

describe('import never silently overwrites (spec 3.3)', () => {
  it('rejects malformed, truncated and foreign files with a clear message', () => {
    expect(() => importData('{"app":"emotional-skills-lab","state":{')).toThrow(/not valid JSON/);
    expect(() => importData('{"app":"other","state":{}}')).toThrow(/Not an Emotional Skills Lab/);
    expect(() => importData(JSON.stringify({ app: 'emotional-skills-lab', formatVersion: 9, state: emptyState() }))).toThrow(/newer version/);
  });
  it('export envelope is documented and round-trips', () => {
    const s = completeSession(emptyState(), 'w01d1', right('w01d1'), 10);
    const o = JSON.parse(exportData(s)); expect(o.format).toBe('emotional-skills-lab-export'); expect(o.formatVersion).toBe(1);
    expect(importData(exportData(s)).completed.w01d1.at).toBe(10);
  });
  it('accepts a v1 export by migrating it', () => { expect(importData(JSON.stringify({ app: 'emotional-skills-lab', state: v1() })).schema).toBe(3); });
  it('merge keeps both sides and does not duplicate', () => {
    const a = completeSession(emptyState(), 'w01d1', right('w01d1'), 10); a.journal = [{ id: 'x', at: 5, type: 'checkin', emotions: [] }];
    const b = completeSession(emptyState(), 'w01d1', right('w01d1'), 3); b.journal = [{ id: 'y', at: 6, type: 'checkin', emotions: [] }, { id: 'x', at: 5, type: 'checkin', emotions: [] }];
    b.scenarios = [{ scenarioId: 'sc01', at: 1, emotions: [], response: 1, quality: 2, factsOk: true }];
    const m = mergeStates(a, b);
    expect(m.journal.map(j => j.id).sort()).toEqual(['x', 'y']); expect(m.completed.w01d1.at).toBe(3); expect(m.scenarios).toHaveLength(1);
    expect(mergeStates(m, m).journal).toHaveLength(2);
  });
  it('a pre-import backup is stored and readable', async () => {
    const m = new MemoryStorage(); const s = completeSession(emptyState(), 'w01d1', right('w01d1'), 10);
    await backupBeforeImport(m, s); expect((await readPreImportBackup(m))!.state.completed.w01d1).toBeTruthy();
  });
  it('validate is idempotent', () => { const s = migrate(v1()); expect(validate(structuredClone(s) as never)).toEqual(s); });
});
