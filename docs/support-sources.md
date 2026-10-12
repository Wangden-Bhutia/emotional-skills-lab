# Support routes: verification sources

Every phone number and legal route shown in the app (`src/content/support.ts`, Help page, lesson w12d2, scenario sc41) was checked against an official Government of India source on **13 Oct 2026**. Anything that could not be confirmed on an official source was left out.

| Route shown in app | Official source | What the source confirms |
|---|---|---|
| **112**: emergency (police, fire, ambulance) | https://www.112.gov.in/ (Emergency Response Support System, Ministry of Home Affairs). Also https://www.mha.gov.in/ (ERSS pages) | 112 is the single pan-India emergency number under ERSS. The 112.gov.in page returned HTTP 504 to our fetcher that day. Its content was confirmed through search-indexed copies of 112.gov.in and mha.gov.in pages. |
| **Tele-MANAS 14416 / 1-800-891-4416**: free tele-mental-health helpline | https://telemanas.mohfw.gov.in/home (Ministry of Health and Family Welfare) | The home page lists the toll-free numbers 14416 and 1-800 891 4416 for the National Tele Mental Health Programme. |
| **POSH Internal Committee / Local Committee** | Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013: https://wcd.nic.in/sites/default/files/Sexual-Harassment-at-Workplace-Act.pdf (Ministry of Women and Child Development; Gazette text also at wcd.gov.in) | s.4: every employer constitutes an Internal Committee. s.5: the appropriate Government notifies a District Officer. s.6: the District Officer constitutes a Local Committee for complaints from establishments without an IC because they have fewer than 10 workers, or where the complaint is against the employer. The District Officer designates nodal officers at block, taluka, tehsil or ward level to receive complaints and forward them to the Local Committee. |

## Deliberately omitted (not verified)
- The complaint time limit (s.9, "within three months"). We could not download the Act PDF in full to confirm the exact wording and extension rule, so the app does not state a deadline. It tells people to approach the committee and gives the route only.
- State-specific helplines, NGO numbers and international numbers.

Re-verify these routes before changing any number. Each source URL is stored next to its number in `src/content/support.ts`.
