# Specification compliance checklist (full pass 2026-10-13, updated after the partials pass)

**Sources for this checklist.** Sections 1, 2.1 and 2.2, the start of 2.3, the end of 16, and all of 17 and 18 come from the user's prompt text that this agent could see. Sections 3 to 15 come from `docs/master-prompt-sections-3-15.md`. That file is a condensed extraction of the full prompt, written by the parent agent. It is not a verbatim copy. **Not checked:** the end of 2.3 and the start of 16 (the definition-of-done list before "Privacy disclosures…"). Neither appears in any text available to this agent, so this file has no rows for them.

Status: **pass** = implemented and verified by a test or by the inspection named. **partial** = only partly done or partly verified. **fail** = not done. Test names: `u:` = Vitest (file::name), `e:` = Playwright (file › name).

## 1 Role and mission
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1.1 | Structured training system, not a tracker, timer, quotes or static site | pass | 60 sessions, 3-layer system, gym; u:content::has 60 sessions |
| 1.2 | Learner acquires knowledge, practises, gets feedback, shows competence, revisits | pass | Lessons, activities, checkpoints, spaced reviews; e:app › week 1 checkpoint… |
| 1.3 | Complete, usable, offline-capable product | pass | e:compliance › 10.5 offline: complete a lesson and a checkpoint offline… |
| 1.4 | Work autonomously; document decisions | pass | docs/curriculum-and-assessment.md, this file |
| 1.5 | No completion claims without evidence | pass | Counts below come from test runs (docs/verification-report.md) |

## 2 Product vision
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 2.1.1 | Recognise and distinguish emotions | pass | Phase 2 (w02–w03); gym emotion step |
| 2.1.2 | Situation–interpretation–body–impulse–emotion–behaviour links | pass | w01d2 "The emotion chain"; classify activities |
| 2.1.3 | Experience vs action | pass | w01d1, w04 pause sessions |
| 2.1.4 | Context-appropriate strategy choice | pass | Phase 4; sheppes2011 claim; strategy-choice items |
| 2.1.5 | Anger, criticism, provocation, anxiety, uncertainty, disappointment, frustration, conflict | pass | Phases 5–7; 43 scenarios in 6 categories |
| 2.1.6 | Professional composure | pass | Phase 7; 23 professional scenarios |
| 2.1.7 | Patterns without unsupported causal conclusions | pass | Phase 8; journal text says "descriptive counts, not causes" |
| 2.1.8 | Reflect on outcomes and learn from mistakes | pass | Explain-back, gym transfer question, w12 review |
| 2.1.9 | Retrieval after time | pass | u:engine::mastery at threshold schedules spaced reviews |
| 2.1.10 | Sustainable practice; no excessive journalling or notifications | pass | No notifications; journal optional (Settings toggle) |
| 2.2a | Everyday contexts (6 listed) | pass | 20 everyday scenarios; u:content::covers both contexts |
| 2.2b | Professional contexts (8 listed) | pass | Phase 7 sessions; professional scenarios incl. sc13, sc14, sc18, sc31, sc34 |
| 2.2c | Not suppression as the goal | pass | w01d3 "Regulation is not suppression" |
| 2.3 | Private practical lab feel (visible text only) | partial | Calm UI and private storage. The rest of 2.3 was not visible and is not checked |

## 3 Constraints
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 3.1 | No AI or LLM at runtime; deterministic rules only | pass | No AI dependencies (package.json); scoring in `src/engine/state.ts` |
| 3.2 | No external APIs, accounts, analytics, CDNs; research links only on click | pass | CSP `default-src 'self'`; e:app › no requests leave the origin |
| 3.3a | All listed records stored locally, never transmitted | pass | `AppState` in IndexedDB; CSP connect-src 'self' |
| 3.3b | Export (documented format), import, delete one journal entry, reset, delete all | pass | e:app › export, delete all, import restores; e:app › journal add, edit and delete |
| 3.3c | Validate imports; handle malformed, incompatible and interrupted imports | pass | u:data::rejects malformed, truncated and foreign files; e:compliance › truncated import file is rejected |
| 3.3d | Never silently overwrite (confirm, merge, backup) | pass | Confirm panel with Merge, Replace and Cancel; automatic pre-import backup; restore. e:compliance › 3.3 import asks before changing anything… |
| 3.4 | Says data is not encrypted; explains browser limits; no secrets | pass | Settings "Your data", Welcome page; e:compliance › onboarding… (checks "not encrypted") |
| 3.5 | Offline after SW cache, for all listed areas; first visit vs later | pass | e:compliance › 3.5 offline: export, delete and import a backup without a connection; e:compliance › 3.5 first visit without a service worker (in-app note in Settings and Welcome) |
| 3.6 | Storage behind an interface for Capacitor | pass | `KVStorage` interface; docs/android.md |

## 4 Research integrity
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 4.1a | Register before the final curriculum | pass | docs/research-register.md (from the first build) |
| 4.1b | Verify suggested references | partial | Gross 1998, Gross 2015, Eisenstadt 2021 and Macrynikola 2024 checked on Crossref and added. Dunlosky: the suggested DOI 10.1111/j.1539-6053.2013.01003.x returned 404, so the working publisher DOI is used. Beck and WHO were not verified and are listed as not cited (Library). u:spec13::suggested references… |
| 4.2a | Per-source register fields | partial | `src/content/evidence.ts`: type, design, population, limitations, use. Population and sample size are given only where the abstract states them; outcomes are not extracted separately |
| 4.2b | Kinds of claim kept apart (technique / digital / intervention / this app) | pass | Library intro paragraph; Eisenstadt and Macrynikola claims say "does not validate this app" |
| 4.2c | Direct vs extrapolation vs background marked | pass | Library badge per source; u:spec13::every source has register metadata with a use label |
| 4.3 | Limitations visible; nothing invented | pass | Library limitations per source; the review limitations from 2021 and 2024 are quoted from the abstracts |
| 4.4 | No false precision; thresholds labelled design choices | pass | Progress "How scoring works" (formerly a separate Assessment centre page, merged into Progress) "not a validated cutoff"; u:spec13::threshold is described as a design choice |
| 4.5 | No copyrighted questionnaires; custom items labelled non-validated | pass | ERQ and DERS-16 excluded; "Original, non-validated" text on checks |

## 5 Curriculum
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 5.1a | 12 weeks, about 60 sessions, 5 a week | pass | u:content::has 60 sessions over 12 weeks |
| 5.1b | Slower pace without penalty | pass | Nothing expires; Welcome page says so |
| 5.1c | 15–30 min; durations stated honestly | partial | Each session shows a range taken from a measured scripted walk-through plus published reading rates (docs/durations.md); u:durations. Measured ranges are 3–15 min, below the 15–30 target. Not timed with real learners |
| 5.1d | No padding | pass | u:content::no duplicated teaching paragraphs |
| 5.2 | Nine phases with the listed topics | pass | 7 thin sub-topics now have full teaching blocks with a worked example and a scored item, added to existing sessions (`src/content/topics.ts`): limits of self-report (P1), when to express emotion (P4), assertive, aggressive and passive (P5), protective vs restrictive avoidance (P6), unequal power and incentives (P7), reinforcement and patterns vs causes (P8), and behavioural experiments (P8). Still 60 sessions, all 30 min or under. u:spec13::5.2 thin sub-topics deepened |
| 5.3 | Each session has the listed parts | pass | u:content::session %s meets depth rules (activity, explain, apply, prerequisites, sources, duration, alt items) |
| 5.3b | No vague advice | pass | u:spec13::5.3b vague-advice check (phrases such as "stay calm", "be mindful", "think positively" are flagged unless the sentence is specific or contrasts them; the checker has its own test) |

## 6 Three-layer system
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 6.L1 | Varied interactive formats with feedback that explains | pass | 5 activity types; u:content::activity types are varied |
| 6.L2 | Explain-back: rubric, model answer, self-rating, revise, says it is not graded | pass | e:app › lesson has keyboard-operable activity … explain-back rubric |
| 6.L3 | Objective mastery with alternative, cumulative and delayed items | pass | u:engine::checkpoint retake draws different items; cumulative items test |
| 6.L3b | Per-skill competency, evidence, rules, threshold, remediation, reassessment | pass | `src/content/competencies.ts`: a statement for each of the 48 skills plus a shared evidence rule; shown before each lesson and in Progress. u:spec13::6.L3b; e:compliance › 6.L3b competency statement is shown |
| 6.1 | Completion, mastery and retention kept separate; remediation; no overall EI score | pass | Progress "Demonstrated performance"; u:engine::completion does not imply mastery |
| 6.2 | Spaced review tied to objectives; schedule labelled a choice | pass | Review lists objectives; Settings text |

## 7 Gym
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 7.0 | At least 36 fully authored scenarios | pass | 43 |
| 7.1 | At least 6 per category, real coverage | pass | u:content::categories match spec 7.1 |
| 7.2a | Narrative, facts, ambiguity, decision, 3 or more options, consequences | pass | u:spec13::at least 3 options per decision |
| 7.2b | Trade-off feedback on every option (protects, costs, fits) | pass | `tradeoffs.ts`, `branches2.ts`; u:spec13::every scenario option … has feedback and trade-offs; e:compliance › 7.2/7.3 every option shows trade-offs |
| 7.2c | Not one virtuous answer against absurd ones | pass | sc03, sc21 and sc38 rewritten. Every decision now has at most one "likely to backfire" option and at least one partial or second strong option. u:spec13::7.2c plausible options |
| 7.3 | Branching with proportionate consequences; no "perfect response" | pass | 29 of 43 branch, at least 3 per category; each follow-up says others' responses are not under your control. u:spec13::most scenarios branch |
| 7.4 | Tracked by skill and type; alternatives; revisit without shame | pass | Progress table by category; "Try a similar scenario"; "Worth another try" list |

## 8 Baseline, post, follow-up
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 8.1 | Baseline: goals, confidence, knowledge, scenarios; not a diagnosis | pass | Separate optional `recurring` field, not analysed. e:compliance › 8.1 baseline saves the optional recurring-situations reflection |
| 8.2 | Post: knowledge, scenarios, explanation, self-report, retention, unseen items | pass | New sets POST_KNOWLEDGE_ITEMS (6) and POST_SJT_ITEMS (8), not shared with baseline or lessons; retention section draws earlier-phase lesson items (also used in follow-ups). u:spec13::8.2 (2 tests); e:compliance › 8.2 post check uses unseen items |
| 8.3 | Follow-ups at 2 and 6 weeks; postpone or turn off; results kept separate | pass | u:engine follow-up tests; Progress table |
| 8.4 | ERQ and DERS-16 investigated; omitted if unverified | pass | Library "Not cited" section; register |

## 9 Screens
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 9.1 | Onboarding with all listed parts; revisitable | pass | `#/welcome`; e:compliance › 9.1/9.2/9.5…; link in Settings |
| 9.2 | Dashboard: phase, next lesson, priorities, completed, skills mastered, reviews due, next action; no streaks | partial | Home; same test. Deviation: a day-streak counter and a 9-dot phase path were added to Home at the user's explicit request, which conflicts with this row's "no streaks" requirement; flagged here rather than silently removed. |
| 9.3 | Curriculum browser: status, prerequisites, what's next and why, revisit | pass | Programme shows completion and skill status; Session shows prerequisites |
| 9.4 | Lesson reader keeps progress across reload | pass | e:compliance › 9.4 lesson progress survives reload |
| 9.5 | Assessment centre with transparent scoring | pass | Merged into Progress (`#/progress`, alias `#/assess`): "How scoring works", phase checkpoints (cumulative), reviews due, skills needing practice, baseline/post/follow-up — folded here to remove duplication with 9.8, rather than kept as a separate page |
| 9.6 | Gym filters, practise, feedback, retry alternatives | pass | e:app › gym filters…; similar-scenario links |
| 9.7 | Journal: listed fields, optional, edit and delete, no interpretation | pass | Fields: What happened / What I noticed / My interpretation / Emotion or impulse / What I did / What happened next? / What I will try next time. Schema 2→3 moves old "outcome" into "next". u:data::schema 2 -> 3 journal migration (3 tests); e:compliance › 9.7 |
| 9.8 | Progress: by skill, assessment, review history; self-report kept apart | pass | Progress sections |
| 9.9 | Library: citations, DOIs, use, limits, evidence type | pass | e:app › library shows verified sources |
| 9.10 | Settings: export, import, reset, delete, preferences, privacy, about/version; confirmations | pass | Settings; every destructive action uses confirm() |

## 10 Architecture
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 10.1 | React, strict TS, Vite, IndexedDB, SW, Vitest, Playwright, Actions | pass | package.json, tsconfig strict |
| 10.2 | Typed content; validation fails the build | pass | `npm run build` runs tsc; Vitest content tests run in CI before deploy |
| 10.3 | Storage interface; versioned IDB; UI independent of storage | pass | `DB_VERSION`, `KVStorage`; u:data::IndexedDB adapter has an explicit version |
| 10.4 | Versioned records; no duplicates or bad ranges; migrations; corrupt-data recovery | pass | `engine/data.ts` (schema 3); u:data (schema migrations, corrupt-data recovery); e:compliance › 10.4 stored v1 data is migrated… |
| 10.5a | Versioned caching | pass | Content-hash cache name (`scripts/gen-sw.mjs`) |
| 10.5b | Tests: first load, offline reload, offline lesson/assessment/persistence | pass | e:app › works offline…; e:compliance › 10.5 offline… |
| 10.5c | Tests: update, cache replacement, failed update, broken release not cached | pass | e:compliance › 10.5 service worker updates (2 tests) |
| 10.5d | Compatibility between app versions and stored data | pass | Migration tests (unit and e2e) |
| 10.5e | Explain updates and data preservation to users | pass | Settings "About" |
| 10.6 | Network audit | pass | e:app › no requests leave the origin (local and live) |
| 10.7 | Pages via Actions; base path; verified live | pass | deploy.yml; e2e against live after push (see verification report) |
| 10.8 | Installable PWA; Capacitor documented | partial | Manifest test passes. Not installed on a real Android device |

## 11 UX
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 11.1 | Calm hierarchy; distinct styles; colour never the only signal | pass | Ratings shown as text labels plus colour; no gradients or charts |
| 11.2a | Automated WCAG 2.2 AA scan | pass | axe on 15 routes at 360px |
| 11.2b | Keyboard operation and visible focus | pass | e:compliance › 11.2 keyboard only (lesson; scenario) |
| 11.2c | Screen-reader check | partial | Roles and live regions are in place. No manual screen-reader session |
| 11.3 | Phone, tablet and desktop: no overflow or tiny controls | pass | e:compliance › 11.3 at 768px and 1280px; e:app 360px set |
| 11.4 | Respectful, non-shaming wording | pass | "Worth another try"; safety text; author review |

## 12 Safety
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 12a | Clear boundaries: not a medical device, therapy or crisis service | pass | Help, Welcome, About |
| 12b | Threat, coercion and harassment scenarios put safety first; tolerating is never rated ideal | pass | sc36, sc41, sc42, sc43; u:spec13::12 safety (4 tests); e:compliance › 12 safety scenario… |
| 12c | Not responsible for others' behaviour; anger and anxiety not pathologised | pass | Safety note text; u:spec13::safety feedback never blames the learner |
| 12d | No unverified crisis resources | pass | Only India 112 (the user's jurisdiction) plus "local emergency services" |

## 13 QA automated checks
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 13.1 | Curriculum checks (12 listed) | pass | u:content plus u:spec13::13.1 (prerequisites and remediation resolve, no placeholders, options have feedback, deterministic scoring) |
| 13.2 | Assessment checks (10 listed) | pass | u:engine, u:spec13::13.2 |
| 13.3 | Research checks | partial | Automated: DOI, metadata, use labels, no efficacy claims. Claims match abstracts, not full texts |
| 13.4 | Functional e2e list (17 areas) | pass | 53 Playwright tests cover every listed area, including migrations, SW updates and keyboard |

## 14 Execution stages
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 14.1–10 | Stages followed; docs written; lint in CI | pass | ESLint 9 with typescript-eslint recommended and react-hooks recommended (`eslint.config.js`), 0 errors, no disable comments; `npm run lint` runs in CI before tests |

## 15 Deliverables
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 15.1–13 | App, UI, curriculum, layers, scenarios, storage, checks, journal, library, data controls, offline, tests, CI | pass | As above |
| 15.14–19 | README, privacy, methodology, curriculum design, Android note, verification report | pass | `README.md`, `docs/*.md` |

## 16 (visible part) to 18
| # | Requirement | Status | Evidence |
|---|---|---|---|
| 16a | Privacy text matches what storage actually does | pass | Settings and privacy.md say "not encrypted" and explain the import backup |
| 16b | No data sent externally | pass | Network audit test |
| 16c | Learner can see how progress and mastery are calculated | pass | Progress ("How scoring works"), Settings |
| 16d | Honest reporting | pass | This file; verification report |
| 17 | Final report format | pass | Delivered in the final message |
| 18.1–14 | Operating instructions (no prohibited services, no invented results, nothing destructive without notice) | pass | No destructive git operations; results come from runs |

## Totals
Counted from the rows above: see the line at the end of `docs/verification-report.md`.
