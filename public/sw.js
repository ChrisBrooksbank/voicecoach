const CACHE_NAME = 'voicecoach-v2';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

function cacheResponse(request, response) {
  if (response.ok && response.type === 'basic') {
    const copy = response.clone();
    void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // Pages go network-first so a new deploy is picked up instead of a stale shell
  // pointing at hashed bundles that no longer exist.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => cacheResponse('/index.html', response))
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  // Hashed build assets are immutable, so cache them as they load to make the app work offline.
  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request).then((response) => cacheResponse(request, response))),
  );
});
