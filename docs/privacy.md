# Privacy

- **Stored locally only:** session completion, checkpoint and review answers (item log), activity results, explanation-back text and self-ratings, scenario attempts and transfer reflections, journal entries, baseline/post/follow-up results, settings. Stored in this browser's IndexedDB. The theme choice is also mirrored to `localStorage` so it can be applied before the app loads.
- **Transmitted:** nothing. There is no backend, account, analytics, crash reporting, font CDN or AI service. The Content Security Policy restricts all loading and connections to the app's own origin, and an automated test fails if any request leaves the origin.
- **Explanations are never graded or read by the app.** They are stored so you can see them later; they are included in exports.
- **Export / import:** Settings exports a JSON file; import validates the file and replaces current data after confirmation.
- **Deletion:** individual journal entries can be deleted; "Reset progress" keeps journal and assessments; "Delete all data" clears the store.
- **Limits:** clearing browser data, uninstalling, private browsing or browser storage eviction can erase data. Export backups. Exported files are unencrypted; keep them somewhere private. Hosting (GitHub Pages) receives normal web requests when the app is first loaded or updated, like any website; the app itself sends no personal data.
