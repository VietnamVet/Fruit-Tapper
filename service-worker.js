
const CACHE_NAME = 'fruit-tapper-cache-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');
const { precaching, routing, strategies, core, expiration } = workbox;
core.skipWaiting();
core.clientsClaim();

// 1. Precache your shell + static assets
precaching.precacheAndRoute([
  { url: '/', revision: 'v57' },
  { url: '/index.html', revision: 'v57' },
  { url: '/manifest.json', revision: 'v57' },
  { url: '/icon-192.png', revision: 'v57' },
  { url: '/icon-512.png', revision: 'v57' },
]);

// 2. Runtime caching for images – stale-while-revalidate
routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new strategies.StaleWhileRevalidate({
    cacheName: 'fruit-images',
    plugins: [
      new expiration.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 7 * 24 * 3600 })
    ]
  })
);

// 3. Runtime caching for CSS & JS – stale-while-revalidate
routing.registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script',
  new strategies.StaleWhileRevalidate({
    cacheName: 'fruit-static',
  })
);

// 4. Runtime caching for audio – CacheFirst
routing.registerRoute(
  ({ request }) => request.destination === 'audio',
  new strategies.CacheFirst({
    cacheName: 'fruit-audio',
    plugins: [
      new expiration.ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 30 * 24 * 3600 })
    ]
  })
);

// Listen for skipWaiting messages so we can update immediately
self.addEventListener('message', (evt) => {
  if (evt.data && evt.data.type === 'SKIP_WAITING') {
    core.skipWaiting();
  }
});

// Push Notification Handler
self.addEventListener('push', event => {
  const data = event.data?.json() || { title: 'Fruit Tapper', body: 'Time to tap some fruit!' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  );
});

// Background Sync for Idle Earnings
self.addEventListener('sync', event => {
  if (event.tag === 'idle-earnings') {
    event.waitUntil((async () => {
      const last = await idb.get('lastActive') || Date.now();
      const now = Date.now();
      // Cap to at most 60 minutes of idle time
const maxIdleMinutes = 2000;  // allows up to 2000 min * 5 coins/min = 10000 coins
const rawMinutes     = Math.floor((now - last) / 60000);
const minutes        = Math.min(rawMinutes, maxIdleMinutes);
      const amount = minutes * 5;
      const clients = await self.clients.matchAll();
      for (const client of clients) {
        client.postMessage({ type: 'IDLE_EARN', amount });
      }
      await idb.set('lastActive', now);
    })());
  }
});
