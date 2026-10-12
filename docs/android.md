# Android migration note

1. **Now:** install as a PWA from Chrome (manifest, icons, offline service worker in place). Not yet tested on a physical Android device.
2. **Store listing, minimal change:** wrap with a Trusted Web Activity (Bubblewrap) or **Capacitor**. With Capacitor: `npm i @capacitor/core @capacitor/cli @capacitor/android`, `npx cap init`, set `webDir: 'dist'`, set Vite `base: './'`, `npm run build && npx cap add android && npx cap sync`. Keep the CSP; remove the service worker registration inside the native shell, since assets are bundled.
3. **Storage:** IndexedDB works inside the WebView. For durability, implement `KVStorage` (`src/storage/storage.ts`) on `@capacitor/preferences` or SQLite; the engine and content need no change.
4. **Export:** replace the download link with the Capacitor Filesystem and Share plugins.
5. **Privacy:** declare no data collection in the Play Data safety form only if no SDKs are added.
