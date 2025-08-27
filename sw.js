const CACHE_NAME = 'iccdc-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/images/logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // For API calls, use Network First, then Cache strategy.
  // This ensures users get the most up-to-date data when online.
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // If the network request is successful, clone it and cache it for offline use.
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            if(event.request.method === 'GET') {
              cache.put(event.request, responseToCache);
            }
          });
          return networkResponse;
        })
        .catch(() => {
          // If the network request fails (e.g., offline), try to serve from the cache.
          return caches.match(event.request);
        })
    );
    return;
  }

  // For all other requests (static assets), use Cache First, then Network strategy.
  // This is fast and enables the app to work offline.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Cache hit - return response
        if (cachedResponse) {
          return cachedResponse;
        }

        // Not in cache, fetch from network.
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response to cache.
            // We only cache basic same-origin GET requests.
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                if(event.request.method === 'GET') {
                    cache.put(event.request, responseToCache);
                }
              });

            return networkResponse;
          }
        );
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('push', event => {
  let data = { title: 'New Message', body: 'You have a new message.' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error('Push event payload is not valid JSON.', e);
  }

  const title = data.title;
  const options = {
    body: data.body,
    icon: '/images/logo.png',
    badge: '/images/logo.png'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});