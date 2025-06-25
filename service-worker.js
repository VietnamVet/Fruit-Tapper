
const CACHE = 'static-v1';
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll([
        '/',
        '/index.html',
        '/offline.html'
      ])
    )
  );
  self.skipWaiting();
});
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html'))
    );
    return;
  }
  event.respondWith(caches.match(event.request).then(r => r || fetch(event.request)));
});

// Background Sync for /api/ POSTs
self.addEventListener('sync', event => {
  if (event.tag === 'sync-posts') {
    event.waitUntil(
      // You would replay your POST requests here, e.g., from IndexedDB
      Promise.resolve()
    );
  }
});

// Periodic Sync for background update
self.addEventListener('periodicsync', event => {
  if (event.tag === 'refresh-content') {
    event.waitUntil(fetch('/api/latest-data'));
  }
});
