/* ============================================================
   CORE MODULE: pwa.js
   Відповідає за:
   - реєстрацію service worker
   - статус мережі (online/offline)
   - оновлення UI індикатора
   - запуск offline → online autosync
============================================================ */

import { autosyncQueue } from "./sync.js";

/* ------------------------------------------------------------
   1. Реєстрація Service Worker
------------------------------------------------------------ */
export function initPWA() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker
            .register("service-worker.js")
            .then(() => console.log("[PWA] Service Worker активний"))
            .catch(err => console.error("SW error:", err));
    }

    updateStatusBar();

    // Слухаємо зміни інтернету
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
}

/* ------------------------------------------------------------
   2. Оновлення UI статусу
------------------------------------------------------------ */
export function updateStatusBar() {
    const el = document.getElementById("statusBar");
    if (!el) return;

    if (navigator.onLine) {
        el.innerHTML = "🟢 Онлайн";
        el.style.color = "limegreen";
    } else {
        el.innerHTML = "🔴 Оффлайн";
        el.style.color = "red";
    }
}

/* ------------------------------------------------------------
   3. Подія — інтернет зʼявився
------------------------------------------------------------ */
function handleOnline() {
    console.log("[PWA] ONLINE — запускаємо синхронізацію");

    updateStatusBar();

    // Запускаємо чергу авто-синхронізації
    autosyncQueue();
}

/* ------------------------------------------------------------
   4. Подія — інтернет зник
------------------------------------------------------------ */
function handleOffline() {
    console.log("[PWA] OFFLINE — переходимо в локальний режим");

    updateStatusBar();
}

/* ------------------------------------------------------------
   5. Точка запуску цього модуля
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", initPWA);