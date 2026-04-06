importScripts("https://progressier.app/iVYywbbJgD4P3roaR84E/sw.js");

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
