import { test, expect } from '@playwright/test';
import { answerQuiz, doSession } from './helpers';

// Regression tests for the 2026-10 UX audit fixes (docs/verification-report.md, "UX audit fixes").
test.beforeEach(async ({ page }) => { await page.goto('./'); await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible(); });

test('audit 5: at 360x740 Today has one primary card with Start above the fold; "New here?" hides after baseline', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.reload();
  const start = page.getByRole('button', { name: 'Start session' });
  await expect(start).toBeInViewport({ ratio: 1 });
  expect((await start.boundingBox())!.y + (await start.boundingBox())!.height).toBeLessThanOrEqual(740);
  await expect(page.locator('main .primary')).toHaveCount(1);
  await expect(page.getByText('New here?')).toBeVisible();
  await page.getByRole('link', { name: 'Read the 2-minute introduction' }).click();
  await page.getByRole('button', { name: 'Go to Today' }).click();
  await expect(page.getByText('New here?')).toHaveCount(0);
});

test('audit 1: a failed checkpoint never says complete; retake is primary; programme shows attempted, not mastered', async ({ page }) => {
  for (const id of ['w01d1', 'w01d2', 'w01d3', 'w01d4']) await doSession(page, id);
  await page.goto('./#/session/w01d5');
  await page.getByRole('button', { name: 'Next: explain it back' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await answerQuiz(page, false);
  await expect(page.getByRole('heading', { name: 'Checkpoint not passed yet' })).toBeVisible();
  await expect(page.getByText(/complete/i)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Retake checkpoint' })).toHaveClass(/primary/);
  await page.getByRole('button', { name: 'Continue without retaking' }).click();
  await page.goto('./#/programme');
  await expect(page.getByText(/not yet mastered/).first()).toBeVisible();
});

test('audit 9: lesson step bar marks the current step with text and aria-current, not colour alone', async ({ page }) => {
  await page.goto('./#/session/w01d1');
  const bar = page.getByRole('list', { name: 'Session steps' });
  await expect(bar.getByRole('listitem')).toHaveCount(4);
  await expect(bar.locator('[aria-current="step"]')).toContainText('Learn');
  for (const k of ['Learn', 'Try']) await expect(page.locator('.kicker', { hasText: k }).first()).toBeVisible();
});

test('audit 10: Auto theme follows the OS live without reload', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('in-app confirm: Escape cancels, focus starts on the safe control, nothing is deleted', async ({ page }) => {
  await page.goto('./#/settings');
  await page.getByRole('button', { name: 'Delete all data' }).click();
  const dlg = page.getByRole('dialog');
  await expect(dlg).toBeVisible();
  await expect(dlg.getByLabel(/Type DELETE/)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dlg).toHaveCount(0);
  await expect(page.getByText('All data deleted.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Delete all data' })).toBeFocused();
  await page.getByRole('button', { name: 'Reset progress' }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
});

test('audit 2: help page lists 112, Tele-MANAS and the POSH committee route', async ({ page }) => {
  await page.goto('./#/help');
  await expect(page.getByText(/112/).first()).toBeVisible();
  await expect(page.getByText(/14416/).first()).toBeVisible();
  await expect(page.getByText(/1-800-891-4416/).first()).toBeVisible();
  await expect(page.getByText(/Internal Committee/).first()).toBeVisible();
  await expect(page.getByText(/Local Committee/).first()).toBeVisible();
});
