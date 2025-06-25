
const CACHE = "pwabuilder-offline-page";
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');
importScripts('https://unpkg.com/idb-keyval@6/dist/idb-keyval-iife.min.js');
const offlineFallbackPage = "offline.html";

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(offlineFallbackPage))
  );
});

if (workbox.navigationPreload.isSupported()) workbox.navigationPreload.enable();

workbox.routing.registerRoute(
  new RegExp('/*'),
  new workbox.strategies.StaleWhileRevalidate({ cacheName: CACHE })
);

// Background sync for POSTs to /api/
self.addEventListener('fetch', event => {
  if (event.request.method === 'POST' && event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cloned = event.request.clone();
        let body = {};
        try { body = await cloned.json(); } catch (e) {}
        idbKeyval.get('outbox').then(queue => {
          queue = queue || [];
          queue.push({
            url: event.request.url,
            headers: [...event.request.headers.entries()],
            body: body
          });
          idbKeyval.set('outbox', queue);
        });
        self.registration.sync.register('sync-posts');
        return new Response(JSON.stringify({status: 'queued offline'}), {status: 503});
      })
    );
    return;
  }
});

self.addEventListener('sync', event => {
  if (event.tag === 'sync-posts') {
    event.waitUntil(
      idbKeyval.get('outbox').then(queue => {
        if (!queue || !queue.length) return;
        return Promise.all(queue.map(entry =>
          fetch(entry.url, {
            method: 'POST',
            headers: entry.headers,
            body: JSON.stringify(entry.body)
          })
        )).then(() => idbKeyval.set('outbox', []));
      })
    );
  }
});

self.addEventListener('periodicsync', event => {
  if (event.tag === 'refresh-content') {
    event.waitUntil(fetch('/api/latest-data'));
  }
});

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'FruitTapper',
      { body: data.body || '', icon: '/icon-192.png', data: data.url || '/' }
    )
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;
        if (preloadResp) return preloadResp;
        const networkResp = await fetch(event.request);
        return networkResp;
      } catch (error) {
        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match(offlineFallbackPage);
        return cachedResp;
      }
    })());
  }
});
