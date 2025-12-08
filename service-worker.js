// ==============================
// SERVICE WORKER — PRO MODE
// ==============================

const CACHE_NAME = "quail-pro-cache-v1";
const FILES_TO_CACHE = [
  "./",
  "index.html",
  "app.js",
  "material.css",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

// ------- INSTALL -------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// ------- ACTIVATE -------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      )
    )
  );
  self.clients.claim();
});

// ------- FETCH STRATEGY (network → fallback cache) -------
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// =====================================
// BACKGROUND SYNC — OFFLINE QUEUE
// =====================================

let syncQueue = [];

// отримує запити від app.js
self.addEventListener("message", (event) => {
  if (event.data?.type === "queue-sync") {
    syncQueue.push(event.data.payload);
  }
});

// Виконується коли мережа з’явилась
self.addEventListener("sync", async (event) => {
  if (event.tag === "sync-drive") {
    for (let item of syncQueue) {
      try {
        await fetch(item.url, {
          method: item.method,
          headers: item.headers || {},
          body: item.body ? JSON.stringify(item.body) : null,
        });
      } catch (e) {
        console.warn("Sync failed, retry later.");
        return;
      }
    }
    syncQueue = [];
  }
});