importScripts('https://unpkg.com/idb-keyval@6/dist/idb-keyval-iife.min.js');
// Background Sync integration
const QUEUE_STORE = 'outbox';

// 1. Intercept and queue failed POSTs
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method === 'POST' && req.url.includes('/api/')) {
    event.respondWith(
      fetch(req.clone()).catch(() => {
        return req.clone().json().then(body => {
          return idbKeyval.get(QUEUE_STORE).then(queue => {
            queue = queue || [];
            queue.push({ url: req.url, body, headers: [...req.headers] });
            return idbKeyval.set(QUEUE_STORE, queue);
          });
        }).then(() => {
          return self.registration.sync.register('sync-outbox');
        }).then(() => {
          return new Response(JSON.stringify({ success: false, offline: true }), {
            headers: { 'Content-Type': 'application/json' }
          });
        });
      })
    );
  }
});

// 2. On sync, replay everything in the queue
self.addEventListener('sync', event => {
  if (event.tag === 'sync-outbox') {
    event.waitUntil(
      idbKeyval.get(QUEUE_STORE).then(queue => {
        if (!queue || !queue.length) return;
        return queue.reduce((chain, entry) => {
          return chain.then(() => {
            return fetch(entry.url, {
              method: 'POST',
              headers: new Headers(entry.headers),
              body: JSON.stringify(entry.body)
            }).then(res => {
              if (!res.ok) throw new Error('Server error');
              return idbKeyval.get(QUEUE_STORE).then(q => {
                q.shift();
                return idbKeyval.set(QUEUE_STORE, q);
              });
            });
          });
        }, Promise.resolve());
      })
    );
  }
});