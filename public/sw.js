// KeyPrime Service Worker - Minimal version
const CACHE_NAME = 'keyprime-v3';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Only handle same-origin GET requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  // Network first, no caching for simplicity
  event.respondWith(fetch(event.request));
});
