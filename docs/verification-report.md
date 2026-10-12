# Verification report (deepening pass, 12 Oct 2026)

Commit verified: `294081e` on `main`, Wangden-Bhutia/emotional-skills-lab. Live: https://wangden-bhutia.github.io/emotional-skills-lab/

## Commands and results
| Check | Result |
|---|---|
| `npm run typecheck` | 0 errors |
| `npm test` (Vitest) | 192 passed, 0 failed |
| `npm run build` | OK; service worker precaches 8 files |
| `npx playwright test` (local preview, Pixel 7 profile, 412px) | 30 passed, 0 failed |
| GitHub Actions "CI and deploy" run 38289719956 | success (typecheck, unit, build, e2e, Pages deploy) |
| Playwright against live URL | 29 passed, 1 flaky: the theme pre-paint test timed out on its first try (1.2 s limit on a cold network fetch) and passed on retry; re-run 4 times in a row against live: 4 passed |

## What the tests cover
Content rules (depth, activity per lesson/practice, per-option feedback, explanation-back in every session, alternative items, prerequisites, 15 to 30 min estimate, varied activity types, no duplicate paragraphs, spec 7.1 categories, branching, transfer questions, knowledge items separate from lesson items, no prohibited claims). Engine (unlocking, completion vs mastery, retake rotation, cumulative items, remediation, per-skill mastery, follow-up timing, postpone and disable, export/import). Browser (lesson, checkpoint fail then retake with different questions and remediation, keyboard activity, sequence via buttons, explain-back rubric and revise, branching scenario, gym filters, baseline, journal edit and delete, export/delete/import, theme pre-paint, no external requests, axe WCAG 2.2 AA at 360px on 12 routes, manifest, offline).

## Not verified
- Real Android install and use; screen-reader walkthrough; real-user session timings; learning outcomes.
- Requirements in the part of the master prompt that was not visible to the implementing agent (see `docs/spec-compliance.md`).
