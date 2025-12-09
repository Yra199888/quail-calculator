/* ============================================================
   SERVICE WORKER — QUAIL CALCULATOR PRO MODE
   Offline cache + autosync queue + background sync
============================================================ */

const CACHE_NAME = "quail-pro-cache-v2";

const FILES_TO_CACHE = [
  "/", 
  "/index.html",
  "/material.css",

  // CORE
  "/core/data.js",
  "/core/storage.js",
  "/core/sync.js",
  "/core/drive.js",
  "/core/pwa.js",

  // MODULES
  "/modules/feed.js",
  "/modules/eggs.js",
  "/modules/orders.js",
  "/modules/clients.js",
  "/modules/finance.js",
  "/modules/incub.js",
  "/modules/flock.js",
  "/modules/logs.js",
  "/modules/render.js",

  // APP LOGIC
  "/app.js",

  // ICONS (якщо є)
  "/icon-192.png",
  "/icon-512.png"
];

/* ------------------------------------------------------------
   INSTALL — кешуємо файли
------------------------------------------------------------ */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

/* ------------------------------------------------------------
   ACTIVATE — чистимо старий кеш
------------------------------------------------------------ */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

/* ------------------------------------------------------------
   FETCH — offline-first стратегія
------------------------------------------------------------ */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Не кешуємо Google API
  if (request.url.includes("googleapis.com")) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).catch(() => {
          // fallback: якщо треба, можна додати offline.html
        })
      );
    })
  );
});

/* ------------------------------------------------------------
   BACKGROUND SYNC — обробка офлайн-черги
------------------------------------------------------------ */
self.addEventListener("sync", (event) => {
  if (event.tag === "quail-sync") {
    event.waitUntil(runSyncQueue());
  }
});

/* Виклик функції з core/sync.js */
async function runSyncQueue() {
  try {
    const allClients = await self.clients.matchAll();
    for (const client of allClients) {
      client.postMessage({ type: "PROCESS_SYNC_QUEUE" });
    }
  } catch (e) {
    console.error("Sync queue error:", e);
  }
}