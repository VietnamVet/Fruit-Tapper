
// Demo background sync: fake /api/ POST queued
function queueDemoPost() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(reg => {
      // Store failed post in localStorage (simulate IndexedDB for demo)
      localStorage.setItem('sync_post', JSON.stringify({ url: '/api/demo', body: { foo: 'bar' } }));
      reg.sync.register('sync-posts');
    });
  }
}

// Demo periodic sync registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(reg => {
    if ('periodicSync' in reg) {
      reg.periodicSync.register('refresh-content', { minInterval: 24 * 60 * 60 * 1000 });
    }
  });
}

// Demo push registration (dummy key, safe for test)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(reg => {
    if ('PushManager' in window) {
      const base64 = 'BIkxk5nY7k7ZcA9tH7fLbUFXGhIuL6jv5CkyLw1I7RYE4wM8dijMopnYj3r_sVX2sExnp7gtV6wRQF5T6bE3IOM';
      function urlBase64ToUint8Array(b64) {
        const pad = '='.repeat((4 - b64.length % 4) % 4);
        const base64 = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
        const raw = window.atob(base64);
        return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
      }
      reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(base64)
      }).catch(()=>{});
    }
  });
}

// Run demo POST (background sync) on first load
queueDemoPost();
