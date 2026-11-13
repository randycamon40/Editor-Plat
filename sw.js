const CACHE_NAME = 'plat-app-v2'; // Naikkan versi ini (v3, v4, dst) jika kamu update file
const ASSETS = [
  './',
  './index.html',
  './GL-Nummernschild-Mtl.ttf',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

// 1. Proses Install: Menyimpan semua file ke dalam cache HP
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Paksa service worker baru langsung aktif
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Proses Activate: Membersihkan cache versi lama
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

// 3. Proses Fetch: Mengambil file dari cache (agar offline)
self.addEventListener('fetch', (e) => {
  // Hanya proses request GET (abaikan POST/PUT)
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // Jika ada di cache, pakai cache. Jika tidak, ambil dari internet.
      return cachedResponse || fetch(e.request);
    })
  );
});