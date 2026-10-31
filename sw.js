/* Service worker: app shell in cache, parametri fiscali sempre dalla rete quando possibile. */
const CACHE = 'bustapaga-2026-v4';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './rates.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // rates.json e pagina: prima la rete (per avere sempre i dati aggiornati), poi la cache
  if (url.origin === location.origin && (url.pathname.endsWith('rates.json') || e.request.mode === 'navigate')) {
    e.respondWith(fetch(e.request).then((res) => {
      const copy = res.clone();
      const key = url.pathname.endsWith('rates.json') ? './rates.json' : './index.html';
      caches.open(CACHE).then((c) => c.put(key, copy));
      return res;
    }).catch(() => caches.match(url.pathname.endsWith('rates.json') ? './rates.json' : './index.html')));
    return;
  }
  // tutto il resto (icone, font): prima la cache
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return res;
  })));
});
