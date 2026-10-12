// Generates dist/sw.js. Update model: a new build gets a new cache name; install precaches every file atomically
// (cache.addAll fails as a whole), so a broken or partial release never activates and the previous cache keeps serving.
// Only successful same-origin navigations refresh the cached shell. Old esl-* caches are removed on activate.
// Generates dist/sw.js with a precache list of every built file (offline-first, versioned by content hash).
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
const dist = 'dist'; const files = [];
const walk = d => readdirSync(d).forEach(f => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push(p); });
walk(dist);
const list = files.map(f => relative(dist, f)).filter(f => f !== 'sw.js' && f !== '404.html');
const h = createHash('sha256'); list.forEach(f => h.update(f).update(readFileSync(join(dist, f))));
const v = h.digest('hex').slice(0, 12);
writeFileSync(join(dist, 'sw.js'), `const CACHE='esl-${v}';const FILES=${JSON.stringify(['./', ...list.filter(f => f !== 'index.html')])};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('esl-')&&x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
if(r.mode==='navigate'){e.respondWith(fetch(r).then(res=>{if(!res.ok||res.type!=='basic')return caches.match('./').then(m=>m||res);const c=res.clone();caches.open(CACHE).then(x=>x.put('./',c));return res}).catch(()=>caches.match('./')));return}
e.respondWith(caches.match(r).then(m=>m||fetch(r)))});
`);
console.log(`sw.js: ${list.length} files precached, cache esl-${v}`);
