const CACHE = 'tapir-v5';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Always fetch index.html from network (never cache it)
  if(e.request.url.includes('index.html') || e.request.mode === 'navigate'){
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // Everything else: network first, cache fallback
  e.respondWith(
    fetch(e.request).then(response => {
      if(response && response.status === 200){
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
      }
      return response;
    }).catch(() => caches.match(e.request))
  );
});
