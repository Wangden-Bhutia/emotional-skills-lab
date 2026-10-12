# Research register

Verification method: every DOI was resolved against the Crossref REST API (`api.crossref.org/works/<doi>`) on 2026-10-12; authors, year, title and venue in `src/content/sources.ts` were generated from that response (raw: `docs/crossref.json`). 20 of 20 DOIs verified. No source is cited that did not resolve.

Limits:
- Claim texts are the app's plain-language summaries at abstract level. They were not checked line by line against full texts. No effect sizes are reproduced.
- Most findings are from adult, largely Western samples in lab or correlational designs; several (Gross & John 2003; Aldao et al. 2010; Kashdan 2015) are correlational and do not establish causation.
- Worry windows (week 7) are presented as an experiment; no source here tests that technique directly.
- ERQ and DERS-16 were NOT included: redistribution/licensing terms for embedding them in an app were not verified. Baseline/post/follow-up use original, non-validated items labelled as such.
- The 80% mastery threshold and the 2/7/21-day review intervals are design choices informed by, but not derived from, the spacing and retrieval literature.

Traceability: each source has claim ids (`<source>-c1`). Every session and scenario lists `claimIds`; unit tests fail if a claim id is unknown or a claim is unused. The in-app Library shows each claim and where it is used.

## Compliance pass additions (2026-10-13)
- Added from the brief's suggested list after checking each on Crossref: Gross 2015 (10.1080/1047840X.2014.940781), Eisenstadt et al. 2021 (10.2196/31170, JMIR Mental Health 8(11) e31170), and Macrynikola et al. 2024 (10.1038/s44184-023-00048-5, npj Mental Health Research 3:14). Their claim texts follow the Crossref abstracts. Both reviews are cited as evidence about *other* apps, with their stated limitations, not as validation of this app.
- The Dunlosky et al. 2013 DOI suggested in the brief (10.1111/j.1539-6053.2013.01003.x) returned 404 at doi.org and Crossref. The app keeps the resolving publisher DOI 10.1177/1529100612453266 for the same article.
- Beck, *Cognitive Behavior Therapy: Basics and Beyond*, and WHO, *Doing What Matters in Times of Stress*: not verified against a bibliographic record here, so they are **not cited**. The Library lists them as not cited.
- Per-source register fields (type, design, population, limitations, and direct / extrapolation / background use) are in `src/content/evidence.ts` and shown in the Library. Population and sample size are filled in only where the abstract states them.
