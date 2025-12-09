/* ============================
   core/sync.js
   Offline Queue + Auto Sync
============================ */

let SYNC_QUEUE = JSON.parse(localStorage.getItem("syncQueue") || "[]");

/* --- Додати дію в чергу --- */
function queueSync(action, payload) {
    SYNC_QUEUE.push({ action, payload, time: Date.now() });
    localStorage.setItem("syncQueue", JSON.stringify(SYNC_QUEUE));
}

/* --- Позначка статусу мережі --- */
function updateNetworkStatus() {
    const box = document.getElementById("statusBar");
    if (!box) return;

    if (navigator.onLine) {
        box.textContent = "Статус: ONLINE ✓";
        box.style.color = "lime";
        processSyncQueue();
    } else {
        box.textContent = "Статус: OFFLINE ✖";
        box.style.color = "red";
    }
}

window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);

/* --- Виконати чергу --- */
function processSyncQueue() {
    if (!navigator.onLine) return;

    console.log("Обробка офлайн-черги…");

    // Поки що просто очищаємо (пізніше зв’яжемо з Google Drive)
    SYNC_QUEUE = [];
    localStorage.setItem("syncQueue", "[]");
}

updateNetworkStatus();