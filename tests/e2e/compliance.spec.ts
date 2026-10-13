import { test, expect, type Page, type Locator } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { ITEMS, doSession, answerQuiz } from './helpers';

const remote = !!process.env.BASE_URL;
async function tabTo(page: Page, target: Locator, max = 80) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    if (await target.evaluate(el => el === document.activeElement).catch(() => false)) return;
  }
  throw new Error('could not reach element by Tab');
}
const idb = (page: Page, fn: string) => page.evaluate(fn);
const putRaw = (page: Page, value: unknown) => page.evaluate(v => new Promise<void>((res, rej) => {
  const r = indexedDB.open('emotional-skills-lab', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('kv');
  r.onsuccess = () => { const t = r.result.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, 'state-v1'); t.oncomplete = () => { r.result.close(); res(); }; t.onerror = () => rej(t.error); };
}), value);

test.beforeEach(async ({ page }) => { await page.goto('./'); await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible(); });

test('11.2 keyboard only: complete a lesson (activity, explain-back skip, quiz) with Tab, Space and Enter; focus is visible', async ({ page }) => {
  await page.goto('./#/session/w01d1');
  const act = page.locator('section.activity');
  for (const fs of await act.locator('fieldset').all()) { await tabTo(page, fs.getByRole('radio').first()); await page.keyboard.press('Space'); }
  for (const sel of await act.locator('select').all()) { await tabTo(page, sel); await page.keyboard.press('ArrowDown'); }
  const check = act.getByRole('button', { name: /^Check/ });
  if (await check.count()) { await tabTo(page, check); await page.keyboard.press('Enter'); }
  else { await tabTo(page, act.getByRole('radio').first()); await page.keyboard.press('Enter'); }
  const next = page.getByRole('button', { name: 'Next: explain it back' });
  await tabTo(page, next);
  const outline = await next.evaluate(el => { const c = getComputedStyle(el); return c.outlineStyle !== 'none' && c.outlineWidth !== '0px' || c.boxShadow !== 'none'; });
  expect(outline, 'visible focus indicator').toBe(true);
  await page.keyboard.press('Enter');
  await tabTo(page, page.getByRole('button', { name: 'Skip for now' })); await page.keyboard.press('Enter');
  for (;;) {
    const q = (await page.locator('section[aria-label] h3').first().textContent())!.trim();
    const it = ITEMS.find(i => i.q === q)!;
    await tabTo(page, page.getByRole('radio', { name: it.options[it.answer], exact: true })); await page.keyboard.press('Enter');
    const btn = page.getByRole('button', { name: /^(Next question|Finish)$/ });
    const last = (await btn.textContent()) === 'Finish';
    await tabTo(page, btn); await page.keyboard.press('Enter');
    if (last) break;
  }
  await expect(page.getByRole('heading', { name: 'Lesson complete' })).toBeVisible();
});

test('11.2 keyboard only: scenario decisions and branching follow-up', async ({ page }) => {
  await page.goto('./#/gym/sc01');
  await tabTo(page, page.getByRole('button', { name: 'Check' })); await page.keyboard.press('Enter');
  await tabTo(page, page.getByRole('button', { name: 'Next' })); await page.keyboard.press('Enter');
  await tabTo(page, page.getByRole('checkbox').first()); await page.keyboard.press('Space');
  await tabTo(page, page.getByRole('button', { name: 'Check' })); await page.keyboard.press('Enter');
  await tabTo(page, page.getByRole('button', { name: 'Next' })); await page.keyboard.press('Enter');
  await tabTo(page, page.getByRole('button', { name: /Read all comments later/ })); await page.keyboard.press('Enter');
  await expect(page.getByText('Protects').first()).toBeVisible();
  await tabTo(page, page.getByRole('button', { name: 'What happens next' })); await page.keyboard.press('Enter');
  await expect(page.getByText(/Your manager offers 10 minutes tomorrow/)).toBeVisible();
});

async function toResponses(page: Page, id: string) {
  await page.goto('./#/gym'); await page.goto(`./#/gym/${id}`);
  await page.getByRole('button', { name: 'Check' }).click(); await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('checkbox').first().check(); await page.getByRole('button', { name: 'Check' }).click(); await page.getByRole('button', { name: 'Next' }).click();
}
test('7.2/7.3 every option shows trade-offs; consequences differ by first choice', async ({ page }) => {
  await toResponses(page, 'sc13');
  await page.getByRole('button', { name: /Tell both managers/ }).click();
  await expect(page.locator('dl.tradeoff')).toHaveCount(3);
  await expect(page.getByText('Fits when').first()).toBeVisible();
  await page.getByRole('button', { name: 'What happens next' }).click();
  await expect(page.getByText(/Mine can wait until Thursday/)).toBeVisible();
  await page.getByRole('button', { name: /Confirm the agreed order/ }).click();
  await expect(page.getByText(/not under your control/)).toBeVisible();
  await toResponses(page, 'sc13');
  await page.getByRole('button', { name: /Stay up all night/ }).click();
  await page.getByRole('button', { name: 'What happens next' }).click();
  await expect(page.getByText(/each has errors/)).toBeVisible();
});

test('12 safety scenario: safety-first notice, no blame label for complying under pressure, formal route named', async ({ page }) => {
  await toResponses(page, 'sc41');
  await expect(page.getByRole('heading', { name: 'Safety first' })).toBeVisible();
  await page.getByRole('button', { name: /keep being friendly/ }).click();
  const chosen = page.locator('.fb.chosen');
  await expect(chosen).toContainText('Understandable; leaves some risk with you');
  await expect(chosen).not.toContainText(/backfire/i);
  await expect(chosen).toContainText('not your job to manage');
  await expect(page.locator('.fb.q2')).toContainText(/Internal Committee/);
});

test('3.3 import asks before changing anything; merge keeps both; cancel changes nothing; pre-import backup can be restored', async ({ page }) => {
  await doSession(page, 'w01d1');
  await page.goto('./#/settings');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export backup' }).click()]);
  const exported = JSON.parse(readFileSync((await dl.path())!, 'utf8'));
  exported.state.journal = [{ id: 'imported-1', at: 1, type: 'checkin', emotions: [], note: 'from the backup file' }];
  await page.goto('./#/journal');
  await page.getByRole('button', { name: 'Quick check-in' }).click(); await page.getByLabel('One line (optional)').fill('local only entry'); await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.goto('./#/settings');
  const file = { name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) };
  await page.locator('input[type=file]').setInputFiles(file);
  await expect(page.getByRole('region', { name: 'Confirm import' })).toContainText('1 journal entries');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByText('Import cancelled. Nothing was changed.')).toBeVisible();
  await page.locator('input[type=file]').setInputFiles(file);
  await page.getByRole('button', { name: 'Merge with current data' }).click();
  await expect(page.getByText(/Merge complete/)).toBeVisible();
  await page.goto('./#/journal');
  await expect(page.getByText('local only entry')).toBeVisible(); await expect(page.getByText('from the backup file')).toBeVisible();
  await page.goto('./#/settings');
  await page.getByRole('button', { name: 'Restore it' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Restore backup' }).click();
  await expect(page.getByText('Restored data from before the last import.')).toBeVisible();
  await page.goto('./#/journal'); await expect(page.getByText('from the backup file')).toHaveCount(0); await expect(page.getByText('local only entry')).toBeVisible();
});

test('3.3 truncated import file is rejected and nothing changes', async ({ page }) => {
  await doSession(page, 'w01d1');
  await page.goto('./#/settings');
  await page.locator('input[type=file]').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"app":"emotional-skills-lab","state":{"sche') });
  await expect(page.getByText(/Import failed: The file is not valid JSON.*Nothing was changed/)).toBeVisible();
  await page.goto('./'); await expect(page.getByRole('heading', { name: 'The emotion chain' })).toBeVisible();
});

test('10.4 stored v1 data is migrated on load; corrupt data is kept aside with a clear notice', async ({ page }) => {
  await putRaw(page, { schema: 1, completed: { w01d1: { at: 1, checks: {} } }, phaseResults: {}, items: {}, scenarios: [], journal: [], assessments: [], settings: { theme: 'auto', reducedMotion: false } });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'The emotion chain' })).toBeVisible();
  await putRaw(page, { schema: 'broken' });
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('could not be read');
  const keys = await idb(page, `new Promise(res => { const r = indexedDB.open('emotional-skills-lab', 1); r.onsuccess = () => { const q = r.result.transaction('kv').objectStore('kv').getAllKeys(); q.onsuccess = () => { r.result.close(); res(q.result); }; }; })`) as string[];
  expect(keys.some(k => k.startsWith('unreadable-'))).toBe(true);
});

test('9.4 lesson progress survives reload mid-session', async ({ page }) => {
  await page.goto('./#/session/w01d1');
  const act = page.locator('section.activity');
  for (const fs of await act.locator('fieldset').all()) await fs.getByRole('radio').first().check();
  for (const sel of await act.locator('select').all()) await sel.selectOption({ index: 1 });
  const check = act.getByRole('button', { name: /^Check/ });
  if (await check.count()) await check.click(); else await act.getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Next: explain it back' }).click();
  await page.reload();
  await expect(page.getByText('Resumed where you left off.')).toBeVisible();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await answerQuiz(page);
  await expect(page.getByRole('heading', { name: 'Lesson complete' })).toBeVisible();
});

test('9.1/9.2/9.5 onboarding, dashboard priorities and assessment centre', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Start session' })).toBeVisible();
  await expect(page.getByText(/Phase 1/).first()).toBeVisible();
  await page.getByText('Why this session next').click();
  await page.getByRole('link', { name: 'Read the 2-minute introduction' }).click();
  await expect(page.getByRole('heading', { name: 'What it can and cannot do' })).toBeVisible();
  await expect(page.getByText(/not encrypted/)).toBeVisible();
  await page.getByRole('button', { name: 'Go to Today' }).click();
  await expect(page.getByText('New here?')).toHaveCount(0);
  await page.goto('./#/assess');
  await expect(page.getByRole('heading', { name: 'Assessment centre' })).toBeVisible();
  await expect(page.getByText(/not a validated cutoff/)).toBeVisible();
});

test('10.5 offline: complete a lesson and a checkpoint offline, data persists after reconnect', async ({ page, context }) => {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  for (const id of ['w01d1', 'w01d2', 'w01d3', 'w01d4']) await doSession(page, id);
  await page.goto('./#/session/w01d5');
  await page.getByRole('button', { name: 'Next: explain it back' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await answerQuiz(page);
  await expect(page.getByText(/Phase mastered/)).toBeVisible();
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await context.setOffline(false);
  await page.goto('./#/progress'); await expect(page.getByText('1 of 9 phases')).toBeVisible();
});

// ---------- Service worker update tests against a controllable local copy of the production build ----------
test.describe('10.5 service worker updates', () => {
  test.skip(remote, 'needs a controllable server; runs against the local build');
  let server: Server; let root: string; const PORT = 4391;
  const base = `http://localhost:${PORT}/emotional-skills-lab/`;
  test.beforeAll(async () => {
    if (!existsSync('dist/sw.js')) throw new Error('run npm run build first');
    root = mkdtempSync(join(tmpdir(), 'esl-'));
    cpSync('dist', root, { recursive: true });
    const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
    server = createServer((req, res) => {
      let p = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/emotional-skills-lab/, '');
      if (p === '' || p.endsWith('/')) p += 'index.html';
      const f = join(root, p);
      if (!existsSync(f)) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'content-type': types[extname(f)] ?? 'application/octet-stream', 'cache-control': 'no-cache' }); res.end(readFileSync(f));
    });
    await new Promise<void>(r => server.listen(PORT, r));
  });
  test.afterAll(() => { server?.close(); });
  const swSrc = () => readFileSync(join(root, 'sw.js'), 'utf8');
  const cacheNames = (page: Page) => page.evaluate(() => caches.keys());

  test('failed update keeps the working version; a good update replaces the cache and keeps data', async ({ page, context }) => {
    const original = swSrc();
    const v1 = /const CACHE='(esl-[^']+)'/.exec(original)![1];
    await page.goto(base);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); await page.evaluate(() => navigator.serviceWorker.ready);
    expect(await cacheNames(page)).toEqual([v1]);
    // Create data that must survive updates.
    await page.goto(base + '#/journal');
    await page.getByRole('button', { name: 'Quick check-in' }).click(); await page.getByLabel('One line (optional)').fill('survives updates'); await page.getByRole('button', { name: 'Save', exact: true }).click();

    // 1) Broken release: precache references a missing file, so install fails as a whole.
    writeFileSync(join(root, 'sw.js'), original.replace(v1, 'esl-broken').replace('const FILES=[', 'const FILES=["missing-asset.js",'));
    await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r!.update().catch(() => undefined); await new Promise(res => setTimeout(res, 1500)); });
    const active1 = await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())!.active!.scriptURL);
    expect(active1).toContain('sw.js');
    expect(await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())!.waiting)).toBeNull();
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Reflections' })).toBeVisible();
    await expect(page.getByText('survives updates')).toBeVisible();
    await context.setOffline(false);

    // 2) Good release: new cache name; old caches are removed on activate; data is untouched.
    writeFileSync(join(root, 'sw.js'), original.replace(v1, 'esl-next'));
    await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      const changed = new Promise(res => navigator.serviceWorker.addEventListener('controllerchange', res, { once: true }));
      await r!.update(); await changed;
    });
    await expect.poll(() => cacheNames(page)).toEqual(['esl-next']);
    await page.reload();
    await expect(page.getByText('survives updates')).toBeVisible();
    await context.setOffline(true); await page.reload();
    await expect(page.getByText('survives updates')).toBeVisible();
    await context.setOffline(false);
    writeFileSync(join(root, 'sw.js'), original);
  });

  test('a server error page is never cached as the app shell', async ({ page, context }) => {
    await page.goto(base);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); await page.evaluate(() => navigator.serviceWorker.ready);
    const idx = readFileSync(join(root, 'index.html'));
    // Serve 404 for the shell to simulate a partial or broken deploy.
    const fs = await import('node:fs'); fs.rmSync(join(root, 'index.html'));
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
    await context.setOffline(true); await page.reload();
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
    await context.setOffline(false);
    writeFileSync(join(root, 'index.html'), idx);
  });
});

for (const [w, h] of [[768, 1024], [1280, 800]] as const) {
  test(`11.3 no horizontal overflow and usable controls at ${w}px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    for (const r of ['#/', '#/gym/sc41', '#/session/w01d1', '#/settings', '#/progress', '#/library', '#/assess']) {
      await page.goto('./' + r); await page.waitForTimeout(100);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), r).toBe(true);
      const small = await page.evaluate(() => [...document.querySelectorAll('button')].filter(b => { const x = b.getBoundingClientRect(); return x.width > 0 && !b.classList.contains('link') && (x.height < 24 || x.width < 24); }).length);
      expect(small, `tiny buttons on ${r}`).toBe(0);
    }
  });
}

test('3.5 offline: export, delete and import a backup without a connection; offline-ready note', async ({ page, context }) => {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.evaluate(() => navigator.serviceWorker.ready);
  await doSession(page, 'w01d1');
  await context.setOffline(true);
  await page.goto('./#/settings');
  await expect(page.locator('[data-offline-ready]')).toHaveAttribute('data-offline-ready', 'yes');
  await expect(page.getByText(/Offline ready/)).toBeVisible();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export backup' }).click()]);
  const file = (await dl.path())!;
  await page.getByRole('button', { name: 'Delete all data' }).click();
  await page.getByRole('dialog').getByLabel(/Type DELETE/).fill('DELETE');
  await page.getByRole('dialog').getByRole('button', { name: 'Delete everything' }).click();
  await expect(page.getByText('All data deleted.')).toBeVisible();
  await page.locator('input[type=file]').setInputFiles(file);
  await page.getByRole('button', { name: 'Replace current data' }).click();
  await expect(page.getByText(/Import complete/)).toBeVisible();
  await page.goto('./'); await expect(page.getByRole('heading', { name: 'The emotion chain' })).toBeVisible();
  await context.setOffline(false);
});

test.describe('3.5 first visit without a service worker', () => {
  test.use({ serviceWorkers: 'block' });
  test('shows the first-visit download note', async ({ page }) => {
    await page.goto('./#/settings');
    await expect(page.getByText(/First visit: the app is still downloading/)).toBeVisible();
  });
});

test('9.7 journal reflection has "What happened next?" as its own field', async ({ page }) => {
  await page.goto('./#/journal');
  await page.getByRole('button', { name: 'Full reflection' }).click();
  await expect(page.getByText('Every field is optional.')).toBeVisible();
  await page.getByLabel('What happened', { exact: true }).fill('Late reply from a client');
  await page.getByLabel('What happened next?').fill('They apologised the next morning');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('They apologised the next morning')).toBeVisible();
  await page.reload();
  await expect(page.getByText('They apologised the next morning')).toBeVisible();
});

test('8.1 baseline saves the optional recurring-situations reflection separately', async ({ page }) => {
  await page.goto('./#/assess/baseline');
  await page.getByLabel(/which situations keep coming up/).fill('Monday status meetings');
  for (const fs of await page.locator('fieldset.rating').all()) await fs.getByRole('radio').nth(2).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await answerQuiz(page); await answerQuiz(page);
  await page.getByRole('button', { name: 'See progress' }).click();
  await expect(page.getByText('Situations you noted at baseline: Monday status meetings')).toBeVisible();
});

test('8.2 post check uses unseen items and adds a retention section', async ({ page }) => {
  await doSession(page, 'w01d1'); await doSession(page, 'w01d2');
  await page.goto('./#/assess/post');
  for (const fs of await page.locator('fieldset.rating').all()) await fs.getByRole('radio').nth(3).check();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Which statement is a camera fact?')).toBeVisible();
  await answerQuiz(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await answerQuiz(page);
  await expect(page.getByText(/Retention: 2 questions from lessons/)).toBeVisible();
  await answerQuiz(page);
  await page.getByRole('button', { name: 'See progress' }).click();
  await expect(page.getByRole('cell', { name: '2/2' })).toBeVisible();
});

test('6.L3b competency statement is shown before a lesson and in progress', async ({ page }) => {
  await page.goto('./#/session/w01d1');
  await page.getByText('Before you start: competency, prerequisites and time').click();
  await expect(page.getByText(/Competency:/)).toBeVisible();
  await page.goto('./#/progress');
  await page.getByText(/Show all 48 skills/).click();
  await expect(page.locator('.competency').first()).toContainText(/you can/i);
});
