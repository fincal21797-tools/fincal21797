const CACHE_NAME = 'fincal-cache-v2';

const ASSETS = [
  './',
  './index.html',
  './Swp calculator.html',
  './Gold calculator.html',
  './Rolling returns calculator.html',
  './Health insurance calculator.html',
  './Debt engine.html',
  './Ledger finance tracker.html',
  './financial-health-check.html',
  './Goal planner.html',
  './Retirement calculator.html',
  './site.webmanifest',
  './favicon.ico',
  './favicon-16x16.png',
  './favicon-32x32.png',
  './apple-touch-icon.png',
  './android-chrome-192x192.png',
  './android-chrome-512x512.png'
];

// Install: pre-cache all app pages and assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => {
            // Ignore individual failures so one bad path doesn't block install
          })
        )
      );
    })
  );
});

// Activate: clean up old caches
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

// Fetch strategy:
// - HTML pages and the manifest: network-first (so updates show up immediately),
//   falling back to cache only when offline.
// - Everything else (icons, etc.): cache-first for speed.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;
  const isNavigation = event.request.mode === 'navigate' || url.endsWith('.html');
  const isManifest = url.endsWith('.webmanifest');

  if (isNavigation || isManifest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
