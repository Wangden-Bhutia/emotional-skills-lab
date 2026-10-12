# Research methodology and limitations

1. **Selection.** 20 peer-reviewed sources on emotion regulation, labelling, distancing, rumination, implementation intentions and learning science (retrieval, spacing) were chosen because they inform specific skills taught.
2. **Verification.** Every DOI was resolved against the Crossref API; title, authors, year and venue were compared and stored (`docs/crossref.json`). Unit tests require a DOI and a verification flag for every source.
3. **Claims.** Each source carries one or more plain-language claims written at abstract level. Sessions and scenarios cite claim ids, and tests require every id to resolve and every claim to be used.
4. **Limitations.**
   - Claims were not checked against full texts and give no effect sizes.
   - Much of the evidence is correlational (for example suppression, granularity, rumination) or from laboratory tasks (affect labelling). The app says so where it applies.
   - The programme as a whole has not been evaluated. It is not therapy and makes no clinical claims.
   - Scenario ratings, the 80% mastery threshold, the 2/7/21-day intervals and the duration estimates are design choices, not research-derived values.
   - Baseline/post/follow-up items are original and non-validated; ERQ and DERS-16 were excluded because redistribution licences were not confirmed.
5. **No invented citations.** New content added in the deepening pass cites only existing verified claim ids.
