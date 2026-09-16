const CACHE = 'tapir-v56';
const CRITICAL = [
  '/huellas-de-tapir/',
  '/huellas-de-tapir/index.html',
  '/huellas-de-tapir/manifest.json',
];

// ── INSTALL: pre-cache critical assets ──
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CRITICAL).catch(() => {}))
  );
});

// ── ACTIVATE: clear old caches ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH: cache-first for HTML/app, network-first for external ──
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // External requests (OSM, clima, fonts) — network only, no cache
  if(url.hostname !== self.location.hostname){
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 503})));
    return;
  }

  // App files — cache-first: serve from cache instantly, update in background
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(e.request);
      // Fetch update in background (don't wait)
      const networkFetch = fetch(e.request)
        .then(resp => {
          if(resp && resp.status === 200) cache.put(e.request, resp.clone());
          return resp;
        })
        .catch(() => null);
      // Return cache immediately if available
      if(cached) return cached;
      // Otherwise wait for network
      return networkFetch || new Response('App no disponible offline', {status: 503});
    })
  );
});
