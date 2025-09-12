const CACHE_NAME = 'iccdc-v3-optimized';
const STATIC_CACHE = 'iccdc-static-v3';
const DYNAMIC_CACHE = 'iccdc-dynamic-v3';
const API_CACHE = 'iccdc-api-v3';

// Critical resources to cache immediately
const urlsToCache = [
  '/',
  '/index.html',
  '/images/church-logo-hq.png',
  '/images/jesus-cross-sunset.jpg',
  '/manifest.json'
];

// Static assets to cache (with longer TTL)
const staticAssets = [
  '/images/',
  '/assets/',
  '/fonts/',
  'https://fonts.googleapis.com/',
  'https://fonts.gstatic.com/',
  'https://cdn.tailwindcss.com'
];

// API routes to cache with network-first strategy
const apiRoutes = [
  '/api/'
];

self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching critical resources...');
        return cache.addAll(urlsToCache);
      }),
      self.skipWaiting() // Activate immediately
    ])
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests - Network First strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(API_CACHE).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets - Cache First strategy
  const isStaticAsset = staticAssets.some(pattern => 
    url.pathname.startsWith(pattern) || url.href.includes(pattern)
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              caches.open(STATIC_CACHE).then(cache => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          });
        })
        .catch(() => {
          // Return fallback for images
          if (request.destination === 'image') {
            return caches.match('/images/placeholder.jpg');
          }
        })
    );
    return;
  }

  // Handle documents and pages - Stale While Revalidate strategy
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          const fetchPromise = fetch(request)
            .then(networkResponse => {
              if (networkResponse.ok) {
                const responseToCache = networkResponse.clone();
                caches.open(DYNAMIC_CACHE).then(cache => {
                  cache.put(request, responseToCache);
                });
              }
              return networkResponse;
            });

          return cachedResponse || fetchPromise;
        })
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Default - try cache first, then network
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        return cachedResponse || fetch(request);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
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