import { expect, type Page } from '@playwright/test';
import { SESSIONS } from '../../src/content/sessions';
import { SJT_ITEMS, KNOWLEDGE_ITEMS, POST_KNOWLEDGE_ITEMS, POST_SJT_ITEMS } from '../../src/content/measures';

export const ITEMS = [...SESSIONS.flatMap(s => [...s.checks, ...s.altChecks]), ...SJT_ITEMS, ...KNOWLEDGE_ITEMS, ...POST_KNOWLEDGE_ITEMS, ...POST_SJT_ITEMS];
/** Finds the shown item by question text; several pools reuse a question stem, so the rendered options disambiguate. */
export async function shownItem(page: Page) {
  const q = (await page.locator('section[aria-label] h3').first().textContent())!.trim();
  const cands = ITEMS.filter(i => i.q === q);
  if (cands.length < 2) return cands[0];
  for (const c of cands) if (await page.getByRole('radio', { name: c.options[c.answer], exact: true }).count() && await page.getByRole('radio', { name: c.options[(c.answer + 1) % c.options.length], exact: true }).count()) return c;
  return cands[0];
}
/** Answers whatever items the app shows (checkpoints draw from a pool), looking each up by its question text. */
export async function answerQuiz(page: Page, correct = true) {
  for (;;) {
    const btn = page.getByRole('button', { name: /^(Next question|Finish)$/ });
    const label = await page.locator('section[aria-label] > p.muted').first().textContent();
    const it = await shownItem(page);
    if (!it) throw new Error('unknown item');
    const pick = correct ? it.answer : (it.answer + 1) % it.options.length;
    await page.getByRole('radio', { name: it.options[pick], exact: true }).click();
    const last = /question (\d+) of \1$/.test(label!.trim());
    await btn.click();
    if (last) break;
  }
}
export async function doActivity(page: Page) {
  const act = page.locator('section.activity');
  if (!(await act.count())) return;
  for (const fs of await act.locator('fieldset').all()) await fs.getByRole('radio').first().check();
  for (const sel of await act.locator('select').all()) await sel.selectOption({ index: 1 });
  const opt = act.getByRole('radio');
  if (!(await act.locator('fieldset').count()) && (await opt.count())) await opt.first().click();
  const check = act.getByRole('button', { name: /^Check/ });
  if (await check.count()) await check.click();
}
export async function doSession(page: Page, id: string, correct = true) {
  await page.goto(`./#/session/${id}`);
  await doActivity(page);
  await page.getByRole('button', { name: 'Next: explain it back' }).click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await answerQuiz(page, correct);
  await expect(page.getByRole('heading', { name: /^(Lesson complete|Checkpoint passed|Checkpoint not passed yet|Review finished)$/ })).toBeVisible();
  await page.getByRole('button', { name: /^(Save and continue|Continue without retaking)$/ }).click();
}

