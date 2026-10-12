import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { SESSIONS } from '../../src/content/sessions';
import { SCENARIOS } from '../../src/content/scenarios';
import { SJT_ITEMS, KNOWLEDGE_ITEMS } from '../../src/content/measures';

import { answerQuiz, doSession } from './helpers';

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
  await page.goto('./#/session/w01d5');
  await page.getByRole('button', { name: 'Next: explain it back' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  const first = await page.locator('section[aria-label] h3').first().textContent();
  await answerQuiz(page, false);
  await expect(page.getByText(/Below the 80% mastery threshold/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Remediation' })).toBeVisible();
  await page.getByRole('button', { name: 'Retake checkpoint' }).click();
  expect(await page.locator('section[aria-label] h3').first().textContent()).not.toBe(first);
  await answerQuiz(page, true);
  await expect(page.getByText(/Phase mastered/)).toBeVisible();
  await page.goto('./#/progress');
  await expect(page.getByText('1 of 9 phases')).toBeVisible();
});

test('locked sessions cannot be opened', async ({ page }) => {
  await page.goto('./#/session/w05d1');
  await expect(page.getByRole('heading', { name: 'Locked' })).toBeVisible();
});

test('baseline assessment saves goals, confidence, knowledge and situations separately', async ({ page }) => {
  await page.getByRole('button', { name: 'Take baseline' }).click();
  await page.getByLabel('Worry or ruminate less').check();
  for (const fs of await page.locator('fieldset.rating').all()) await fs.getByText('Often').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await answerQuiz(page, true);
  await answerQuiz(page, true);
  await page.getByRole('button', { name: 'See progress' }).click();
  await expect(page.getByRole('cell', { name: '8/8' })).toBeVisible();
  await expect(page.getByRole('cell', { name: '6/6' })).toBeVisible();
  await expect(page.getByText(/baseline goals: Worry or ruminate less/)).toBeVisible();
});

test('lesson has keyboard-operable activity with per-item feedback and explain-back rubric', async ({ page }) => {
  await doSession(page, 'w01d1'); await doSession(page, 'w01d2');
  await page.goto('./#/session/w01d3');
  const act = page.locator('section.activity');
  await expect(act.getByText('Activity · Sort it')).toBeVisible();
  await act.getByRole('radio').first().focus(); await page.keyboard.press('Space');
  for (const fs of await act.locator('fieldset').all()) await fs.getByRole('radio').first().check();
  await act.getByRole('button', { name: 'Check answers' }).click();
  await expect(act.getByText('A deliberate, time-limited choice followed by processing is flexible.')).toBeVisible();
  await expect(act.getByText(/Better fit: Flexible regulation/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Next: explain it back' }).click();
  await expect(page.getByText('This app does not read, score or grade what you write.', { exact: false })).toBeVisible();
  await page.getByLabel('Your explanation').fill('Suppression means hiding a feeling while still feeling it. Doing it as a habit tends to cost more than flexible choices.');
  await page.getByRole('button', { name: 'Compare with model key points' }).click();
  await expect(page.getByText('Suppression hides expression while the feeling continues.')).toBeVisible();
  for (const fs of await page.locator('fieldset.rating').all()) await fs.getByText('Partly').click();
  await page.getByRole('button', { name: 'Revise my explanation' }).click();
  await expect(page.getByLabel('Your explanation')).toHaveValue(/Suppression/);
  await page.getByRole('button', { name: 'Compare with model key points' }).click();
  for (const fs of await page.locator('fieldset.rating').all()) await fs.getByText('Yes').click();
  await page.getByRole('button', { name: 'Save self-assessment' }).click();
  await expect(page.getByText(/Knowledge check: question 1/)).toBeVisible();
});

test('sequence activity works with move buttons only', async ({ page }) => {
  await doSession(page, 'w01d1');
  await page.goto('./#/session/w01d2');
  const act = page.locator('section.activity');
  await act.getByRole('button', { name: /^Move down:/ }).first().click();
  await act.getByRole('button', { name: 'Check order' }).click();
  await expect(act.getByText(/Right place|Belongs at position/).first()).toBeVisible();
});

test('branching scenario: follow-up depends on first choice; transfer question', async ({ page }) => {
  const s = SCENARIOS.find(x => x.id === 'sc35')!;
  await page.goto('./#/gym/sc35');
  await page.getByRole('button', { name: 'Check' }).click(); await page.getByRole('button', { name: 'Next' }).click();
  await page.getByLabel(s.emotionOptions[0]).check(); await page.getByRole('button', { name: 'Check' }).click(); await page.getByRole('button', { name: 'Next' }).click();
  const best = s.responses.findIndex(r => r.quality === 2);
  await page.getByRole('button', { name: s.responses[best].text }).click();
  await page.getByRole('button', { name: 'What happens next' }).click();
  await expect(page.getByText(s.followUp!.next[best])).toBeVisible();
  await page.getByRole('button', { name: s.followUp!.options[0].text }).click();
  await expect(page.getByText(s.followUp!.options[0].feedback)).toBeVisible();
  await page.getByRole('button', { name: 'Next: reflect' }).click();
  await page.getByLabel(/Which recent message/).fill('My sister text');
  await page.getByRole('button', { name: 'Save to journal and finish' }).click();
  await page.goto('./#/journal'); await expect(page.getByText(/Gym, Argument with partner: My sister text/)).toBeVisible();
});

test('gym filters by situation, skill and difficulty', async ({ page }) => {
  await page.goto('./#/gym');
  await page.getByLabel('Situation').selectOption({ label: 'Interpersonal misunderstanding' });
  await expect(page.getByText(`${SCENARIOS.filter(s => s.category === 'misunderstanding').length} scenarios shown.`)).toBeVisible();
  await page.getByLabel('Difficulty').selectOption({ label: 'Easier' });
  await expect(page.getByText(`${SCENARIOS.filter(s => s.category === 'misunderstanding' && s.difficulty === 1).length} scenarios shown.`)).toBeVisible();
  await page.getByLabel('Situation').selectOption({ label: 'All' }); await page.getByLabel('Difficulty').selectOption({ label: 'All' });
  await page.getByLabel('Skill').selectOption('Boundaries');
  await expect(page.getByText(`${SCENARIOS.filter(s => s.skill === 'Boundaries').length} scenarios shown.`)).toBeVisible();
});

test('theme is applied before app script runs (no flash) under CSP', async ({ page }) => {
  await page.goto('./#/settings'); await page.getByRole('button', { name: 'Dark' }).click();
  await page.route('**/assets/*.js', r => new Promise(res => setTimeout(() => res(r.continue()), 1500)));
  await page.reload({ waitUntil: 'commit' });
  await page.waitForSelector('html[data-theme]', { timeout: 1200 });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
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

test('journal add, edit and delete individual entry', async ({ page }) => {
  await page.goto('./#/journal');
  await page.getByRole('button', { name: 'Quick check-in' }).click();
  await page.getByRole('button', { name: 'Frustration' }).click();
  await page.getByLabel('One line (optional)').fill('slow morning');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('slow morning')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Frustration 5')).toBeVisible();
  await page.getByRole('button', { name: 'Edit entry' }).click();
  await page.getByLabel('One line (optional)').fill('slow but fine morning');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('slow but fine morning')).toBeVisible();
  await expect(page.getByText(/edited/)).toBeVisible();
  page.on('dialog', d => d.accept());
  await page.getByRole('button', { name: 'Delete entry' }).click();
  await expect(page.getByText('slow but fine morning')).toHaveCount(0);
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
  await page.getByRole('button', { name: 'Replace current data' }).click();
  await expect(page.getByText(/Import complete\./)).toBeVisible();
  await page.goto('./'); await expect(page.getByRole('heading', { name: 'The emotion chain' })).toBeVisible();
});

test('import rejects invalid file', async ({ page }) => {
  await page.goto('./#/settings');
  await page.locator('input[type=file]').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"app":"nope"}') });
  await expect(page.getByText(/Import failed/)).toBeVisible();
});

test('library shows verified sources with DOI links', async ({ page }) => {
  await page.goto('./#/library');
  await expect(page.getByText('DOI verified')).toHaveCount(23);
  await expect(page.getByRole('link', { name: 'doi:10.1037/1089-2680.2.3.271' })).toBeVisible();
});

test('theme toggle switches to dark', async ({ page }) => {
  await page.goto('./#/settings');
  await page.getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

for (const h of ['#/', '#/welcome', '#/assess', '#/programme', '#/session/w01d1', '#/gym/sc35', '#/gym/sc41', '#/gym', '#/gym/sc01', '#/journal', '#/progress', '#/library', '#/settings', '#/help', '#/assess/baseline']) {
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
