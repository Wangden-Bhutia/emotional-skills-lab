# How session durations are worked out

Every session shows a range, for example "4–14 min": the quick end and the thorough end. The range comes from what the built app **actually shows** in each session, measured by a scripted walk-through, and is then converted into minutes using published reading rates plus stated assumptions. **No real learners were timed.** That limit is listed under "Not verified" in docs/verification-report.md.

## 1. Measurement (scripted walk-through)
`tests/e2e/durations.spec.ts` (run it with `npm run build && MEASURE=1 npx playwright test durations`) opens all 60 sessions in programme order in the production build, using Pixel 7 emulation at 412×915. For each session it records:
- **words**: words rendered in the Learn stage (lesson, example, activity, practice), the explain-back screen, and the result screen (key points, application task, sources)
- **interactions**: the activity choices the learner has to make
- **quizItems** and **quizWords**: the questions actually drawn (checkpoints draw from a pool), their options, and the explanation shown after each one

The results go to `src/content/durations.ts`, a generated file. The bot's own wall-clock time is stored as `botSeconds`, but it is not used: a script is not a person.

## 2. Conversion to minutes (`src/content/duration.ts`)
| Part | Quick end | Thorough end | Basis |
|---|---|---|---|
| Reading (words + quizWords) | 260 wpm | 175 wpm | Brysbaert (2019), J. Mem. Lang. 109, doi:10.1016/j.jml.2019.104047. Silent reading of English non-fiction averages 238 wpm, and most adults fall between 175 and 300. The slow end allows for phone screens and second-language readers. |
| Each choice (activity or question) | 5 s | 12 s | Assumption |
| Explain-back | 0.5 min (read the prompt, skip) | 5 min (type 60–150 words on a phone, self-rate) | Assumption |
| Practice steps and the application task | 1 min | 3 min | Assumption |

Formula: the quick end is floored and the thorough end is ceiled. `minutes` (used for sorting and older code paths) is set to the thorough end.

## 3. Result (measured 13 Oct 2026)
- Lessons: about 3–12 to 5–14 minutes.
- Checkpoints and reviews: about 4–13 to 5–15 minutes.
- No session's thorough end goes over 15 minutes.

The spec target was **15–30 minutes**. Measured content does **not** reach it, even at the thorough end, unless the learner also spends real time on the practice and reflection prompts, which have no fixed length. The old fixed "18–26 min" labels overstated the time. The app now shows the measured range, and docs/spec-compliance.md row 5.1c is marked partial.

## 4. Keeping it honest
`tests/unit/durations.test.ts` fails when:
- a session has no measured entry
- the measured words drift outside 1×–2× of the authored content count (this catches content edits made without re-measuring)
- the formula changes without a test update

After editing lesson content, re-run the measurement and commit the regenerated `durations.ts`.
