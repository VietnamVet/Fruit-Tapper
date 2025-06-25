
// Background sync registration (for PWABuilder detection)
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  navigator.serviceWorker.ready.then(sw => {
    sw.sync.register('sync-posts');
  });
}
