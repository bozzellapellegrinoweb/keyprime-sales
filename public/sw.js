// KeyPrime Service Worker - Compatible with OneSignal
const CACHE_NAME = 'keyprime-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install - cache basic files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        // Use addAll with error handling for each file
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => console.log('Cache skip:', url, err))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip non-GET requests and OneSignal requests
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('onesignal')) return;
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone and cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request);
      })
  );
});
