/* ============================
   core/pwa.js
   Service Worker + PWA Status
============================ */

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
        .then(() => console.log("SW зареєстрований"))
        .catch(err => console.error("SW помилка:", err));
}