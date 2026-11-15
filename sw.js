// ==========================================================================
// Service Worker — Plat Nomor App
// --------------------------------------------------------------------------
// Aturan update:
//   • Bump CACHE_VERSION setiap kali update: FE.ttf, icon-*.png,
//     manifest.webmanifest, atau library CDN (xlsx, jszip, localforage).
//   • File HTML (index.html, nopol-csv.html) TIDAK perlu bump —
//     pakai strategi network-first, jadi update langsung kelihatan.
// ==========================================================================

const CACHE_VERSION = 'plat-app-v3';

// Aset same-origin yang di-pre-cache saat install
const PRECACHE = [
  './',
  './index.html',
  './nopol-csv.html',
  './manifest.webmanifest',
  './FE.ttf',
  './icon-192.png',
  './icon-512.png',
  './xlsx.full.min.js',
  './jszip.min.js',
  './localforage.min.js'
];

// ===== Install: pre-cache + langsung aktif =====
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ===== Activate: hapus cache versi lama + ambil alih tab =====
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ===== Fetch: strategi per jenis request =====
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1) HTML / navigasi → network-first, fallback cache
  //    (update HTML langsung kelihatan; offline tetap bisa buka)
  if (req.mode === 'navigate' ||
      (url.origin === self.location.origin && url.pathname.endsWith('.html'))) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_VERSION)
            .then((c) => c.put(req, clone))
            .catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((r) => r || caches.match('./index.html'))
        )
    );
    return;
  }

  // 2) Semua aset lain (font, icon, JS, CSS, CDN, Google Fonts)
  //    → cache-first, fallback network, lalu runtime-cache
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Cache response valid (200) + opaque (CDN no-cors)
        if (res && (res.status === 200 || res.type === 'opaque')) {
          const clone = res.clone();
          caches.open(CACHE_VERSION)
            .then((c) => c.put(req, clone))
            .catch(() => {});
        }
        return res;
      });
    })
  );
});
