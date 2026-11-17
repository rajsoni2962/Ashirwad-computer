// Apna Vyaapar — Android & Multi-Device Service Worker
const CACHE_NAME = 'apna-vyaapar-v2';
const STATIC_ASSETS = [
  '/brand/logo.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Always bypass cache for API routes and database mutations so live MongoDB data is always fresh
  if (url.pathname.startsWith('/api/') || request.method !== 'GET') {
    return;
  }

  // Network-first with fallback to cache for static shell
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && url.pathname.startsWith('/brand/')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
