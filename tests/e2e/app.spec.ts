import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { SESSIONS } from '../../src/content/sessions';
import { SCENARIOS } from '../../src/content/scenarios';

async function answerQuiz(page: Page, items: { options: string[]; answer: number }[], correct = true) {
  for (const it of items) {
    const pick = correct ? it.answer : (it.answer + 1) % it.options.length;
    await page.getByRole('radio', { name: it.options[pick], exact: true }).click();
    await page.getByRole('button', { name: /Next question|Finish/ }).click();
  }
}
async function doSession(page: Page, id: string, correct = true) {
  const s = SESSIONS.find(x => x.id === id)!;
  await page.goto(`./#/session/${id}`);
  await page.getByRole('button', { name: /Check your understanding|Start checkpoint/ }).click();
  await answerQuiz(page, s.checks, correct);
  await expect(page.getByRole('heading', { name: 'Session complete' })).toBeVisible();
  await page.getByRole('button', { name: 'Save and continue' }).click();
}

test.beforeEach(async ({ page }) => { await page.goto('./'); await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible(); });

test('no requests leave the origin', async ({ page, baseURL }) => {
  const ext: string[] = [];
  page.on('request', r => { if (new URL(r.url()).origin !== new URL(baseURL!).origin && !r.url().startsWith('data:')) ext.push(r.url()); });
  for (const h of ['#/', '#/programme', '#/gym', '#/journal', '#/progress', '#/library', '#/settings']) { await page.goto('./' + h); await page.waitForLoadState('networkidle'); }
  expect(ext).toEqual([]);
});

test('lesson completion persists and unlocks next; completion is not mastery', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'What emotions are for' })).toBeVisible();
  await doSession(page, 'w01d1');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'The emotion chain' })).toBeVisible();
  await page.goto('./#/progress');
  await expect(page.getByText('0 of 9 phases')).toBeVisible();
});

test('week 1 checkpoint at 100% masters phase 1; failing shows retake', async ({ page }) => {
  for (const id of ['w01d1', 'w01d2', 'w01d3', 'w01d4']) await doSession(page, id);
  const s = SESSIONS.find(x => x.id === 'w01d5')!;
  await page.goto('./#/session/w01d5');
  await page.getByRole('button', { name: 'Start checkpoint' }).click();
  await answerQuiz(page, s.checks, false);
  await expect(page.getByText(/Below the 80% mastery threshold/)).toBeVisible();
  await page.getByRole('button', { name: 'Retake checkpoint' }).click();
  await answerQuiz(page, s.checks, true);
  await expect(page.getByText(/Phase mastered/)).toBeVisible();
  await page.goto('./#/progress');
  await expect(page.getByText('1 of 9 phases')).toBeVisible();
});

test('locked sessions cannot be opened', async ({ page }) => {
  await page.goto('./#/session/w05d1');
  await expect(page.getByRole('heading', { name: 'Locked' })).toBeVisible();
});

test('baseline assessment saves', async ({ page }) => {
  await page.getByRole('button', { name: 'Take baseline' }).click();
  for (const fs of await page.locator('fieldset.rating').all()) await fs.getByText('Often').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  for (let i = 0; i < 8; i++) { await page.getByRole('radio').nth(1).click(); await page.getByRole('button', { name: /Next question|Finish/ }).click(); }
  await page.getByRole('button', { name: 'See progress' }).click();
  await expect(page.getByRole('cell', { name: '8/8' })).toBeVisible();
});

test('gym scenario full flow records an attempt', async ({ page }) => {
  const s = SCENARIOS[0];
  await page.goto('./#/gym');
  await page.getByRole('button', { name: new RegExp(s.title) }).click();
  for (const f of s.facts) await page.getByLabel(f).check();
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByText('Well separated.')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel(s.emotionOptions[s.plausibleEmotions[0]]).check();
  await page.getByRole('button', { name: 'Check' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  const best = s.responses.findIndex(r => r.quality === 2);
  await page.getByRole('button', { name: s.responses[best].text }).click();
  await expect(page.getByText(/Your choice: Skilful/)).toBeVisible();
  await page.goto('./#/progress');
  await expect(page.getByText('100%').first()).toBeVisible();
});

test('journal add and delete', async ({ page }) => {
  await page.goto('./#/journal');
  await page.getByRole('button', { name: 'Quick check-in' }).click();
  await page.getByRole('button', { name: 'Frustration' }).click();
  await page.getByLabel('One line (optional)').fill('slow morning');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('slow morning')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Frustration 5')).toBeVisible();
  await page.getByRole('button', { name: 'Delete entry' }).click();
  await expect(page.getByText('slow morning')).toHaveCount(0);
});

test('export, delete all, import restores', async ({ page }) => {
  await doSession(page, 'w01d1');
  await page.goto('./#/settings');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export backup' }).click()]);
  const file = await dl.path();
  page.on('dialog', d => d.accept());
  await page.getByRole('button', { name: 'Delete all data' }).click();
  await expect(page.getByText('All data deleted.')).toBeVisible();
  await page.goto('./'); await expect(page.getByRole('heading', { name: 'What emotions are for' })).toBeVisible();
  await page.goto('./#/settings');
  await page.locator('input[type=file]').setInputFiles(file!);
  await expect(page.getByText('Import complete.')).toBeVisible();
  await page.goto('./'); await expect(page.getByRole('heading', { name: 'The emotion chain' })).toBeVisible();
});

test('import rejects invalid file', async ({ page }) => {
  await page.goto('./#/settings');
  await page.locator('input[type=file]').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"app":"nope"}') });
  await expect(page.getByText(/Import failed/)).toBeVisible();
});

test('library shows verified sources with DOI links', async ({ page }) => {
  await page.goto('./#/library');
  await expect(page.getByText('DOI verified')).toHaveCount(20);
  await expect(page.getByRole('link', { name: 'doi:10.1037/1089-2680.2.3.271' })).toBeVisible();
});

test('theme toggle switches to dark', async ({ page }) => {
  await page.goto('./#/settings');
  await page.getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

for (const h of ['#/', '#/programme', '#/session/w01d1', '#/gym', '#/gym/sc01', '#/journal', '#/progress', '#/library', '#/settings', '#/help', '#/assess/baseline']) {
  test(`a11y + no horizontal overflow at 360px: ${h}`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('./' + h);
    await page.waitForTimeout(200);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('manifest is installable shape', async ({ page }) => {
  const res = await page.request.get('manifest.webmanifest');
  const m = await res.json();
  expect(m.id).toBe('/emotional-skills-lab/'); expect(m.display).toBe('standalone');
  expect(m.icons.some((i: { sizes: string }) => i.sizes === '512x512')).toBe(true);
});

test('works offline after first load (service worker)', async ({ page, context }) => {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await page.goto('./#/gym');
  await expect(page.getByRole('heading', { name: 'Scenario gym' })).toBeVisible();
  await context.setOffline(false);
});
