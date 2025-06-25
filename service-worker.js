const CACHE_NAME = 'fruit-tapper-cache-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install & precache
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)));
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Fetch with offline fallback
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then(resp => resp || fetch(event.request).catch(() => caches.match('offline.html')))
    );
  } else {
    event.respondWith(caches.match(event.request).then(resp => resp || fetch(event.request)));
  }
});

// Background Sync handler
self.addEventListener('sync', event => {
  if (event.tag === 'sync-content') {
    event.waitUntil(Promise.resolve());
  }
});

// Periodic Sync handler
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-content') {
    event.waitUntil(Promise.resolve());
  }
});

// Push Notification handler
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Fruit Tapper';
  const options = { body: data.body || 'Check out new features!', icon: 'icons/icon-192.png' };
  event.waitUntil(self.registration.showNotification(title, options));
});