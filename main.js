
// --- Your original game/app code here ---

// --- PUSH NOTIFICATION REGISTRATION ---
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
      }).then(sub => {
        // Send subscription to backend
        fetch('http://localhost:3000/api/save-subscription', {
          method: 'POST',
          body: JSON.stringify(sub),
          headers: { 'Content-Type': 'application/json' }
        });
      }).catch(()=>{});
    }
  });
}



// --- Register Periodic Sync (optional, helps PWA test) ---
if ('serviceWorker' in navigator && 'periodicSync' in navigator.serviceWorker) {
  navigator.serviceWorker.ready.then(swReg => {
    swReg.periodicSync.register('update-game-data', {
      minInterval: 24 * 60 * 60 * 1000 // Once per day
    });
  });
}
