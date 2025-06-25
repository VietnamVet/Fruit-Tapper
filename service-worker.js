importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js');
if (workbox) {
  // Precache app shell and offline page
  workbox.precaching.precacheAndRoute([
    { url: '/',            revision: null },
    { url: '/index.html',  revision: null },
    { url: '/offline.html',revision: null },
    // add other assets as needed
  ]);

  // Serve navigation requests with network-first, fallback to offline.html
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'pages-cache',
      plugins: [
        {
          handlerDidError: async () => caches.match('/offline.html')
        }
      ]
    })
  );

  // Background Sync for POST /api/*
  const { BackgroundSyncPlugin } = workbox.backgroundSync;
  const bgSyncPlugin = new BackgroundSyncPlugin('outboxQueue', {
    maxRetentionTime: 24 * 60
  });
  workbox.routing.registerRoute(
    /\/api\/.*\bPOST\b/,
    new workbox.strategies.NetworkOnly({ plugins: [bgSyncPlugin] }),
    'POST'
  );
}

// Periodic Sync handler
self.addEventListener('periodicsync', evt => {
  if (evt.tag === 'refresh-content') {
    evt.waitUntil(
      fetch('/api/latest-data')
        .then(resp => resp.json())
        .then(data => {
          // TODO: cache or postMessage to clients
        })
    );
  }
});

// Push Notification handlers
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const title = data.title || 'Notification';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', evt => {
  evt.notification.close();
  evt.waitUntil(clients.openWindow(evt.notification.data.url));
});