// Caching strategy
// - This worker only intercepts /notes/* (network-first with 24h TTL).
// - The home page and all other routes go straight to the network.
// - Bump CACHE_NAME on any release that changes cached assets so old
//   caches are evicted on activate.
// - sw-register.ts calls registration.update() on visibilitychange,
//   so returning tabs pick up new SW versions without a hard reload.

const BUILD_ID = 'v2'; // Bump on every release that changes cached assets
const CACHE_NAME = `notes-cache-${BUILD_ID}`;
const NOTES_CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day in milliseconds

// Routes to cache
const NOTES_ROUTE_PATTERN = /^\/notes/;

self.addEventListener('install', () => {
  console.log('[SW] Service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('notes-cache-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only cache GET requests to notes routes
  if (event.request.method !== 'GET' || !NOTES_ROUTE_PATTERN.test(url.pathname)) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);

      if (cachedResponse) {
        const cachedTime = cachedResponse.headers.get('sw-cached-time');
        const now = Date.now();

        // Check if cache is still valid (less than 1 day old)
        if (cachedTime && (now - parseInt(cachedTime, 10)) < NOTES_CACHE_DURATION) {
          console.log('[SW] Serving from cache:', url.pathname);
          return cachedResponse;
        }

        // Cache expired, delete it
        console.log('[SW] Cache expired for:', url.pathname);
        await cache.delete(event.request);
      }

      // Fetch fresh response
      console.log('[SW] Fetching fresh:', url.pathname);
      try {
        const networkResponse = await fetch(event.request);

        if (networkResponse.ok) {
          // Clone and add timestamp header
          const responseToCache = new Response(await networkResponse.clone().blob(), {
            status: networkResponse.status,
            statusText: networkResponse.statusText,
            headers: new Headers(networkResponse.headers)
          });
          responseToCache.headers.set('sw-cached-time', Date.now().toString());

          cache.put(event.request, responseToCache);
        }

        return networkResponse;
      } catch (error) {
        // If network fails and we have a stale cache, return it
        if (cachedResponse) {
          console.log('[SW] Network failed, serving stale cache:', url.pathname);
          return cachedResponse;
        }
        throw error;
      }
    })
  );
});
