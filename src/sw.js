// Bump this on every deploy that meaningfully changes what's cached — it's
// what invalidates the old cache (old caches are swept in 'activate' below).
const CACHE_VERSION = 'v1';
const CACHE_NAME = `fazes-${CACHE_VERSION}`;

// vite-plugin-pwa's injectManifest strategy replaces this placeholder at build
// time with the full list of built asset URLs (hashed JS/CSS filenames plus
// everything copied from public/, including offline.html and the icons).
const APP_SHELL = self.__WB_MANIFEST.map((entry) => (typeof entry === 'string' ? entry : entry.url));

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Lets the page force this worker to activate immediately after an update
// (see src/pwa/sw-register.js's "SKIP_WAITING" postMessage).
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Navigations: try the network first so users get fresh content when online,
  // fall back to the cached shell/offline page when they don't.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/offline.html')))
    );
    return;
  }

  // Everything else (CSS/JS/icons): cache-first, refresh the cache in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
