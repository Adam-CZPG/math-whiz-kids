self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
  // This allows the app to load while offline
  e.respondWith(
    fetch(e.request).catch(() => {
      return new Response("Offline - Please connect to the internet to play.");
    })
  );
});