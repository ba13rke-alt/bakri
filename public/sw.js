// Service Worker for Bakri Marine PWA with robust Network-First caching to prevent white-screen issues
const CACHE_NAME = 'bakri-marine-cache-v9';
const PRE_CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-icon.svg',
  '/pwa-icon.png',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  // __VITE_ASSETS_HOLDER__
];

// On install, pre-cache core assets individually to ensure install never fails
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        PRE_CACHE_ASSETS.map((asset) => {
          return cache.add(asset).catch((err) => {
            console.warn(`Failed to pre-cache ${asset}, skipping to prevent install failure:`, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

// On activate, clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First strategy: Always fetch from network first. Fallback to cache if network fails (offline).
// This guarantees the user never gets stuck with a stale or broken cached white screen!
self.addEventListener('fetch', (event) => {
  // Only handle HTTP/HTTPS, skip other schemes (like chrome-extension or data URLs)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If we get a valid response, cache a clone of it for offline use (only GET requests)
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed (offline), load from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If no cache match and requesting HTML, could return offline fallback, but we'll let it fail gracefully
        });
      })
  );
});
