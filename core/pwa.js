/* ============================================================
   core/pwa.js
   PRO MODE — PWA + статус мережі + Material 3
   ============================================================ */

/* ------------------------------------------------------------
   1. Реєстрація Service Worker
------------------------------------------------------------ */

export function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("service-worker.js")
            .then(() => console.log("✔ Service Worker зареєстровано"))
            .catch(err => console.error("SW Error:", err));
    }
}

/* ------------------------------------------------------------
   2. Відображення статусу мережі (online / offline)
------------------------------------------------------------ */

export function updateNetworkStatus() {
    const bar = document.getElementById("statusBar");

    if (!bar) return;

    if (navigator.onLine) {
        bar.innerText = "Статус: online";
        bar.style.color = "#00c853";   // зелений
    } else {
        bar.innerText = "Статус: offline";
        bar.style.color = "#d50000";   // червоний
    }
}

/* Автоматичне оновлення статусу */
window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);

/* ------------------------------------------------------------
   3. Обробка події "install to home screen" (Android)
------------------------------------------------------------ */

let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;

    const installBtn = document.getElementById("btnInstallApp");
    if (installBtn) {
        installBtn.style.display = "block";
        installBtn.onclick = () => {
            deferredPrompt.prompt();
            deferredPrompt = null;
            installBtn.style.display = "none";
        };
    }
});

/* ------------------------------------------------------------
   4. Ініціалізація PWA при старті програми
------------------------------------------------------------ */

export function initPWA() {
    registerServiceWorker();
    updateNetworkStatus();
    console.log("✔ PWA ініціалізовано");
}