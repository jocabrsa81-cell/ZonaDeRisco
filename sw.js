// Service worker: REDE PRIMEIRO para tudo; a cache só serve quando não há rede.
// Assim cada atualização no GitHub aparece logo.
const CACHE = 'riscomapa-v3';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const guardar = url.origin === location.origin || url.hostname === 'unpkg.com' ||
    url.hostname.includes('open-meteo') || url.hostname.includes('usgs');
  e.respondWith(fetch(e.request, url.origin === location.origin ? { cache: 'no-cache' } : {})
    .then(r => {
      if (r.ok && guardar) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return r;
    })
    .catch(() => caches.match(e.request)));
});
