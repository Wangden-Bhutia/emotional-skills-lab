# Research register

Verification method: every DOI was resolved against the Crossref REST API (`api.crossref.org/works/<doi>`) on 2026-10-12; authors, year, title and venue in `src/content/sources.ts` were generated from that response (raw: `docs/crossref.json`). 20 of 20 DOIs verified. No source is cited that did not resolve.

Limits:
- Claim texts are the app's plain-language summaries at abstract level. They were not checked line by line against full texts. No effect sizes are reproduced.
- Most findings are from adult, largely Western samples in lab or correlational designs; several (Gross & John 2003; Aldao et al. 2010; Kashdan 2015) are correlational and do not establish causation.
- Worry windows (week 7) are presented as an experiment; no source here tests that technique directly.
- ERQ and DERS-16 were NOT included: redistribution/licensing terms for embedding them in an app were not verified. Baseline/post/follow-up use original, non-validated items labelled as such.
- The 80% mastery threshold and the 2/7/21-day review intervals are design choices informed by, but not derived from, the spacing and retrieval literature.

Traceability: each source has claim ids (`<source>-c1`). Every session and scenario lists `claimIds`; unit tests fail if a claim id is unknown or a claim is unused. The in-app Library shows each claim and where it is used.
