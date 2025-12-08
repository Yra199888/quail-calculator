// SERVICE WORKER — OFFLINE + AUTOSYNC BASE
self.addEventListener("install", (e) => {
    self.skipWaiting();
});

self.addEventListener("activate", (e) => {
    clients.claim();
});

// Реєстрація офлайн-механізмів буде вставлена в ЧАСТИНІ 2

// PRO CACHE VERSION
const CACHE = "quail-pro-cache-v1";
const FILES = [
    "/",
    "/index.html",
    "/app.js",
    "/manifest.webmanifest"
];

// install
self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(CACHE).then(c => c.addAll(FILES))
    );
    self.skipWaiting();
});

// fetch offline-first
self.addEventListener("fetch", e => {
    e.respondWith(
        caches.match(e.request).then(r => r || fetch(e.request))
    );
});