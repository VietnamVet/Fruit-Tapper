
importScripts('https://unpkg.com/idb-keyval@6/dist/idb-keyval-iife.min.js');

const STATIC_CACHE = 'static-cache-v1';
const OFFLINE_URL = '/offline.html';
const OUTBOX_STORE = 'outbox';

// Install: cache shell and offline page
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        OFFLINE_URL
      ]);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Fetch: offline fallback for navigation, cache-first for others
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});

// Background Sync: replay POSTs
self.addEventListener('sync', event => {
  if (event.tag === 'sync-posts') {
    event.waitUntil(
      idbKeyval.get(OUTBOX_STORE).then(queue => {
        if (!queue) return;
        return Promise.all(queue.map(entry => {
          return fetch(entry.url, {
            method: 'POST',
            headers: entry.headers,
            body: JSON.stringify(entry.body)
          });
        })).then(() => idbKeyval.del(OUTBOX_STORE));
      })
    );
  }
});

// Periodic Sync: background update
self.addEventListener('periodicsync', event => {
  if (event.tag === 'refresh-content') {
    event.waitUntil(fetch('/api/latest-data'));
  }
});

// Push Notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Notification';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192x192.png',
    data: data.url || '/'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});
