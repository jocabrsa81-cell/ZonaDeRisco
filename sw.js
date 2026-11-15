// Service worker: app shell em cache, dados sempre da rede (com fallback à cache)
const CACHE = 'riscomapa-v2';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isShell = url.origin === location.origin || url.hostname === 'unpkg.com';
  if (isShell) {
    // cache primeiro para a app
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  } else {
    // rede primeiro para dados e mosaicos; guarda cópia para uso offline
    e.respondWith(fetch(e.request).then(r => {
      if (r.ok && (url.hostname.includes('open-meteo') || url.hostname.includes('usgs') || url.hostname.includes('basemaps'))) {
        const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return r;
    }).catch(() => caches.match(e.request)));
  }
});
