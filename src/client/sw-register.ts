if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/notes'
      });
      console.log('[SW] Registration successful, scope:', registration.scope);

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('[SW] New service worker activated');
            }
          });
        }
      });
    } catch (error) {
      console.error('[SW] Registration failed:', error);
    }
  });
}
