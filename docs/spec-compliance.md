# Specification compliance checklist

Status: **pass** = implemented and verified by a test or by inspection noted in the evidence column; **partial** = implemented in part or verified only partly; **fail** = not implemented.

**Source limitation (important).** The master prompt reached the agent that wrote this file with about 44,000 characters omitted from the middle (sections 2.3 to 16 were not visible verbatim). This checklist is built from the visible text (sections 1, 2.1 to 2.3, 16 to 18) and from the section-level requirements relayed in the deepening-pass brief (5.3 session structure, 7.1 scenario categories, 9 baseline/post/follow-up, journal, theme, required docs). Any requirement in the omitted text that is not listed here has **not been checked**. Section numbers below follow the brief where it gave them; other rows are grouped by topic.

| # | Requirement | Status | Evidence |
|---|---|---|---|
| **Product and curriculum** ||||
| 1 | Structured programme, not a tracker or quote app | pass | 60 sessions, 12 weeks, 9 phases (`src/content/sessions.ts`); unit test "has 60 sessions" |
| 2 | Everyday and professional contexts | pass | Phases 7 to 8 and 20 everyday / 20 professional scenarios; unit test "covers both contexts" |
| 3 | Flexible regulation, not suppression as the goal | pass | w01d3, w05d3, w10d1 content; activity in w01d3 |
| 4 | Sessions 15 to 30 minutes, realistic estimate (5.3) | partial | Every session estimates 18 to 26 min (mean 21.6); unit test enforces 15 to 30. Estimate is a formula (`src/content/enrich.ts`), not measured with users; most time comes from the practice exercise, assumed at 3 min per step |
| 5 | Deeper explanation and concrete example per session (5.3) | pass | Unit test: every lesson/practice >= 150 words of teaching + worked example; no duplicated paragraphs |
| 6 | Practical exercise per session (5.3) | pass | `practice` steps in every session (unit test) |
| 7 | Layer 1 varied interactive activity with per-option feedback, keyboard accessible, no drag-only (5.3) | partial | 48/48 lesson and practice sessions: classify 18, sequence 9, match 9, compare 8, predict 4. Per-item feedback enforced by unit test. Native radios, selects and move buttons; e2e tests "keyboard-operable activity", "sequence ... move buttons only". The 12 checkpoint/review sessions have no separate activity (documented exemption: they are themselves interactive assessments) |
| 8 | Layer 2 explanation-back with transparent rubric, model key points, self-assessment, revise, notice that prose is not graded (5.3) | pass | `src/ui/ExplainBack.tsx`; all 60 sessions have a prompt and >= 3 key points (unit test); e2e test covers rubric, compare, revise and notice. Learner may skip; skipping is allowed and not counted |
| 9 | Layer 3 mastery with alternative item pools so retakes use different items (5.3) | pass | `checkpointItems` (least-exposed first, seeded per attempt) and `lessonItems`; each lesson has an alternative item; unit tests "checkpoint retake draws different items", "lesson retake uses alternative items"; e2e test asserts the first retake question differs |
| 10 | Summary, application task, sources, prerequisites, remediation per session (5.3) | pass | Session completion screen; `prerequisites` and `apply` enforced by unit test; remediation list in e2e checkpoint test |
| 11 | Per-skill mastery and remediation, not only per-phase | pass | `skillStatus`, `remediationFor`; Progress "Skills" list; unit test "per-skill mastery needs delayed evidence" |
| 12 | Cumulative and delayed retrieval tied to objectives | pass | Up to 2 earlier-phase items in every checkpoint (unit test); spaced reviews at 2/7/21 days show the objectives being reviewed |
| 13 | 80% threshold disclosed as a design choice | pass | Settings "How progress works", checkpoint text |
| **Scenario gym (7)** ||||
| 14 | Six categories named as in 7.1 | pass | `CATEGORY_LABELS`; unit test against `tests/unit/spec.ts` |
| 15 | At least 6 scenarios per category | pass | 6 to 8 per category, 40 total (unit test) |
| 16 | Facts vs interpretations, emotions, response | pass | Existing flow; e2e test |
| 17 | Branching follow-up decisions where useful | partial | 8 branching scenarios, at least one per category (unit test, e2e test). The other 32 are single-decision |
| 18 | Trade-off feedback | partial | All options have feedback (unit test); branch options name what each choice protects and costs. Many original first-step feedback lines are short and do not state both sides |
| 19 | Reflection / transfer question | pass | Per-category transfer question, saved to journal (e2e test) |
| 20 | Filter by skill, situation, difficulty | pass | Gym filters (e2e test "gym filters") plus context filter |
| 21 | Scenario ratings disclosed as not a validated key | pass | Text under feedback |
| **Assessment (9)** ||||
| 22 | Baseline with goals, confidence, knowledge, scenario tasks | pass | `AssessView`; e2e test checks goals, knowledge 6/6, situations 8/8 |
| 23 | Post-programme including explanation | pass | Post check adds an explain-in-your-own-words step (not graded) |
| 24 | Follow-ups about 2 and 6 weeks, postponable and disableable | pass | `followupDue`, `postponeFollowup`, Settings toggle; unit test |
| 25 | Results kept separate | pass | Each check stored as its own record; Progress shows one row per kind (unit test asserts kinds) |
| 26 | No unlicensed validated questionnaires | pass | ERQ and DERS-16 excluded; items labelled original and non-validated |
| **Journal** ||||
| 27 | Low-burden check-in, reflection, if-then plan | pass | Journal view |
| 28 | Entries editable; individual delete | pass | e2e test "journal add, edit and delete individual entry" |
| **Research integrity** ||||
| 29 | Every source verified, no invented citations | pass | 20 DOIs checked against Crossref (`docs/crossref.json`); unit test |
| 30 | Claims map to verified sources | pass | Every session and scenario `claimIds` resolve (unit test) |
| 31 | Claim summaries checked against full texts | partial | Abstract-level only; stated in Library and `docs/research-methodology.md` |
| 32 | No "clinically proven / validated" claims | pass | Unit test scans all content including new content |
| **Technical, privacy, offline** ||||
| 33 | No AI, backend, analytics, accounts, external requests | pass | CSP `default-src 'self'`; e2e "no requests leave the origin" |
| 34 | Local-first storage with export, import, delete | pass | IndexedDB via `KVStorage`; e2e export/delete/import test |
| 35 | Offline after first load | pass | Service worker precache; e2e offline test (also run against live site) |
| 36 | Theme without flash under CSP | pass | `public/theme-init.js` loaded before the app; e2e test delays app JS and asserts theme is already set |
| 37 | Accessibility (WCAG 2.2 AA automated scan, 360px no overflow) | partial | axe scan on 12 routes passes; no manual screen-reader test |
| 38 | Installable PWA | partial | Manifest test passes; install not tested on a real Android phone |
| **Documentation (16 to 17)** ||||
| 39 | README | pass | `README.md` |
| 40 | Privacy | pass | `docs/privacy.md` |
| 41 | Research methodology and limitations | pass | `docs/research-methodology.md`, `docs/research-register.md` |
| 42 | Curriculum and assessment design | pass | `docs/curriculum-and-assessment.md` |
| 43 | Android / Capacitor note | pass | `docs/android.md` |
| 44 | Final verification report | pass | `docs/verification-report.md` |
| 45 | Honest reporting, no invented results | pass | Counts in reports come from test runs listed in `docs/verification-report.md` |

**Totals:** 37 pass, 8 partial, 0 fail, among the requirements listed. Requirements in the omitted part of the prompt are unchecked.
