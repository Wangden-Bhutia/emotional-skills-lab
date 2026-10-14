import { test, expect } from '@playwright/test';
import { doSession } from './helpers';

test.beforeEach(async ({ page }) => { await page.goto('./'); await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible(); });

test('three labelled tabs with icon and text, 44px targets, correct current tab per area', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Main' });
  const links = nav.getByRole('link');
  await expect(links).toHaveText(['Today', 'Programme', 'Me'].map(t => new RegExp(t)));
  for (const l of await links.all()) { const b = (await l.boundingBox())!; expect(b.height).toBeGreaterThanOrEqual(44); expect(b.width).toBeGreaterThanOrEqual(44); }
  const cur = () => nav.locator('[aria-current="page"]');
  await expect(cur()).toContainText('Today');
  for (const [h, tab] of [['#/programme', 'Programme'], ['#/session/w01d1', 'Programme'], ['#/scenarios', 'Programme'], ['#/gym', 'Programme'], ['#/review', 'Programme'],
    ['#/me', 'Me'], ['#/me/reflections', 'Me'], ['#/journal', 'Me'], ['#/progress', 'Me'], ['#/assess', 'Me'], ['#/library', 'Me'], ['#/settings', 'Me'], ['#/help', 'Me']] as const) {
    await page.goto('./' + h); await expect(cur(), h).toContainText(tab);
  }
});

test('Today: Start above the fold at 360x740 and one practise-a-scenario card', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 }); await page.reload();
  await expect(page.getByRole('button', { name: 'Start session' })).toBeInViewport({ ratio: 1 });
  await page.getByRole('button', { name: 'Practise this scenario' }).click();
  await expect(page).toHaveURL(/#\/scenarios\/sc/);
});

test('old routes still work: #/gym, #/journal, #/progress', async ({ page }) => {
  await page.goto('./#/gym'); await expect(page.getByRole('heading', { name: 'Scenario library' })).toBeVisible();
  await page.goto('./#/journal'); await expect(page.getByRole('heading', { name: 'Reflections' })).toBeVisible();
  await page.goto('./#/progress'); await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('Me lists progress by phase and every section; Programme links to all scenarios', async ({ page }) => {
  await page.goto('./#/me');
  await page.getByText('By phase').click();
  await expect(page.getByRole('table')).toContainText('Foundations');
  for (const n of ['Reflections', 'Library', 'Settings']) await expect(page.getByRole('link', { name: new RegExp(n) })).toBeVisible();
  await page.goto('./#/programme'); await page.getByRole('link', { name: /All scenarios/ }).click();
  await expect(page.getByRole('heading', { name: 'Scenario library' })).toBeVisible();
  await expect(page.getByLabel('Skill')).toBeVisible();
});

test('lesson end shows Practise this and Save as reflection prefills a reflection under Me', async ({ page }) => {
  for (const id of ['w01d1', 'w01d2', 'w01d3']) await doSession(page, id);
  await page.goto('./#/session/w01d4');
  const { doActivity, answerQuiz } = await import('./helpers');
  await doActivity(page);
  await page.getByRole('button', { name: 'Next: explain it back' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await answerQuiz(page);
  await expect(page.getByRole('heading', { name: 'Practise this' })).toBeVisible();
  await expect(page.locator('.practise a').first()).toHaveAttribute('href', /#\/scenarios\/sc/);
  const title = (await page.locator('article h1').textContent())!.trim();
  await page.getByRole('button', { name: 'Save as reflection' }).click();
  await expect(page).toHaveURL(/#\/me\/reflections/);
  await expect(page.locator('main textarea').first()).toHaveValue(`Lesson: ${title}`);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText(`Lesson: ${title}`)).toBeVisible();
});

test('scenario deep links work under #/scenarios', async ({ page }) => {
  await page.goto('./#/scenarios/sc01');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
