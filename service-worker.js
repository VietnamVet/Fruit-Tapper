
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js');

if (workbox) {
  // Precache
  workbox.precaching.precacheAndRoute([
    { url: '/', revision: null },
    { url: '/index.html', revision: null },
    { url: '/offline.html', revision: null },
    { url: '/icon-192.png', revision: null },
    { url: '/icon-512.png', revision: null },
    { url: '/screenshot-1.png', revision: null },
    { url: '/screenshot-2.png', revision: null }
  ]);

  // Navigation fallback
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({cacheName: 'pages', plugins: [
      { handlerDidError: async () => caches.match('/offline.html') }
    ]})
  );

  // Background sync POST queue
  const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('outboxQueue', {
    maxRetentionTime: 24 * 60
  });
  workbox.routing.registerRoute(
    /\/api\/.*\bPOST\b/,
    new workbox.strategies.NetworkOnly({ plugins: [bgSyncPlugin] }),
    'POST'
  );
}

// Periodic sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'refresh-content') {
    event.waitUntil(fetch('/api/latest-data'));
  }
});

// Push
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'FruitTapper';
  const options = { body: data.body || '', icon: '/icon-192.png', data: data.url || '/' };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});
