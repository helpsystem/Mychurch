const CACHE_NAMES = ['iccdc-v3-optimized', 'iccdc-static-v3', 'iccdc-dynamic-v3', 'iccdc-api-v3'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  console.log('Service Worker: Self-Destructing...');
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          console.log('Service Worker: Removing old cache', key);
          return caches.delete(key);
        })
      );
    })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Pass through all requests to network
  e.respondWith(fetch(e.request));
});