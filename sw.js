const CACHE_NAME = "masakin";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/database.js",
  "/manifest.json",
  "/icon",
  // Kamu juga bisa menambahkan '/icon.png' jika mau logonya tersimpan offline
];

// 1. Install Service Worker & Simpan File ke Memori HP
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

// 2. Saat HP Offline, Ambil Data dari Memori (Bukan dari Internet)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Jika file ada di memori offline, pakai itu. Kalau tidak, ambil dari internet.
        return response || fetch(event.request);
      })
      .catch(() => {
        // Abaikan error jika benar-benar offline dan mencari data Firebase
      }),
  );
});
