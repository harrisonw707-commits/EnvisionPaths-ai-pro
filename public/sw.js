const CACHE_NAME = 'envisionpaths-v4'; // Increment version to force update

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // CRITICAL: Bypass cache for API requests and AI requests
  // Ensure Google API calls are passed through directly if they happen
  if (
    event.request.url.includes('/api/') || 
    event.request.url.includes('generativelanguage.googleapis.com') ||
    event.request.url.includes('googleapis.com')
  ) {
    return; // Pass through to network
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
