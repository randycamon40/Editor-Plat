const CACHE_NAME = 'plat-app-v3'; // Naikkan versi ini (v3, v4, dst) setiap kali kamu update file
const ASSETS = [
  './',
  './index.html',
  './GL-Nummernschild-Mtl.ttf',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

// 1. Install: Simpan aset dasar
self.addEventListener('install', (e) => {
  self.skipWaiting(); 
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. Activate: Hapus cache versi lama
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch: Strategi khusus
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // KHUSUS HTML (index.html): Selalu ambil dari internet (Network-First)
  if (e.request.mode === 'navigate' || e.request.url.includes('index.html')) {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          // Simpan versi terbaru ke cache
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match(e.request)) // Kalau offline, baru pakai cache lama
    );
    return;
  }

  // ASET LAIN (font, ikon): Ambil dari cache dulu (Cache-First)
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});