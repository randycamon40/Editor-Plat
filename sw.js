const CACHE_NAME = 'plat-app-v1';
const ASSETS = [
  './',
  './index.html',
  './GL-Nummernschild-Mtl.ttf',
  './manifest.webmanifest'
];

// Simpan file ke cache saat pertama kali dibuka
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Ambil dari cache jika offline
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});