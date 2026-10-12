# Emotional Skills Lab

A private, offline-capable emotional-skills training app: 12-week programme (60 sessions, 9 phases, about 18 to 26 minutes each), 40-scenario gym with branching follow-ups, per-session interactive activities and explanation-back, phase and per-skill mastery with alternative item pools, spaced retention reviews, journal, research library.

Live: https://wangden-bhutia.github.io/emotional-skills-lab/

- Stack: React 18 + TypeScript (strict) + Vite 5. No backend, no accounts, no analytics, no AI, no third-party requests (enforced by CSP and an e2e test).
- Storage: IndexedDB behind the `KVStorage` interface (`src/storage`), so a native Android port can swap the implementation.
- Offline: generated service worker precaches every built file (`scripts/gen-sw.mjs`).
- Content: typed data in `src/content`; `tests/unit/content.test.ts` enforces completeness and source traceability.
- Tests: `npm test` (Vitest), `npm run build && npm run test:e2e` (Playwright, incl. axe WCAG 2.2 AA scan and offline test). CI runs both before deploying to Pages.
- Docs: `docs/spec-compliance.md` (requirement checklist), `docs/curriculum-and-assessment.md`, `docs/research-methodology.md`, `docs/research-register.md`, `docs/privacy.md`, `docs/android.md`, `docs/verification-report.md`.

Not therapy, not clinically validated. In an emergency in India dial 112.

Android migration: see `docs/android.md`.
