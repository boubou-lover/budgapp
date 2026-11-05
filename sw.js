/* Budgapp - mise en cache : l'application s'ouvre même sans réseau.
   - fichiers de l'app : réseau d'abord (les mises à jour s'appliquent aussitôt), cache en secours hors connexion
   - bibliothèques et images : cache d'abord (rapide)
   - Supabase et tout ce qui vient d'un autre site : jamais mis en cache (données toujours fraîches) */
const V='budgapp-v1';
const SHELL=['./','index.html','style.css','app.js','backend.js','config.js','manifest.webmanifest','logo-256.png','icon-pig-72.png','icon-192.png','favicon-32.png','vendor/supabase.js','vendor/xlsx.full.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);if(u.origin!==location.origin)return;
  const put=x=>{if(x&&x.ok){const c=x.clone();caches.open(V).then(h=>h.put(r,c))}return x};
  if(/\/vendor\/|\.(png|ico)$/.test(u.pathname)){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(put)));return}
  e.respondWith(fetch(r).then(put).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
});
