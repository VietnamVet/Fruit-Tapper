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
