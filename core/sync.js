/* ============================================================
   core/sync.js
   FULL PRO MODE — Offline Sync + AutoSync + Queue System
   ------------------------------------------------------------
   Відповідає за:
   - визначення онлайн/офлайн
   - чергу дій (offlineQueue)
   - автоматичну синхронізацію при поверненні мережі
   - виклики Drive Backup/Restore
============================================================ */

import { DATA, saveLocal } from "./storage.js";
import { driveBackup, driveRestore } from "./drive.js";

/* ------------------------------------------------------------
   1. СТАН МЕРЕЖІ
------------------------------------------------------------ */

export let IS_ONLINE = navigator.onLine;

export function updateNetworkStatus() {
    IS_ONLINE = navigator.onLine;
    const bar = document.getElementById("statusBar");

    if (IS_ONLINE) {
        bar.textContent = "Статус: online";
        bar.style.color = "#00b347";
        processQueue(); // коли з’явився інтернет — запускаємо синхронізацію
    } else {
        bar.textContent = "Статус: offline";
        bar.style.color = "#d9534f";
    }
}

window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);


/* ------------------------------------------------------------
   2. ЧЕРГА ОФЛАЙН-ДІЙ
------------------------------------------------------------ */

let offlineQueue = [];

/**
 * Додати дію у чергу.
 * @param {string} type  - тип дії (save, backup, restore)
 * @param {object} payload - дані
 */
export function queueAction(type, payload = {}) {
    offlineQueue.push({
        type,
        payload,
        time: Date.now()
    });

    saveLocal(); // збережемо чергу
}

/**
 * Зберігаємо чергу у localStorage
 */
export function saveQueue() {
    localStorage.setItem("offlineQueue", JSON.stringify(offlineQueue));
}

/**
 * Завантажуємо чергу
 */
export function loadQueue() {
    const q = localStorage.getItem("offlineQueue");
    if (q) {
        offlineQueue = JSON.parse(q);
    }
}


/* ------------------------------------------------------------
   3. ВИКОНАННЯ ЧЕРГИ
------------------------------------------------------------ */

export async function processQueue() {
    if (!IS_ONLINE) return;

    if (offlineQueue.length === 0) return;

    console.log("▶ Processing offline queue…", offlineQueue);

    while (offlineQueue.length > 0 && IS_ONLINE) {
        const action = offlineQueue.shift();

        try {
            if (action.type === "save") {
                // нічого не робимо, autosave вже відпрацьовує
                console.log("✔ synced: local save");
            }

            if (action.type === "backup") {
                console.log("▶ syncing: driveBackup()");
                await driveBackup();
                console.log("✔ synced: driveBackup");
            }

            if (action.type === "restore") {
                console.log("▶ syncing: driveRestore()");
                await driveRestore();
                console.log("✔ synced: driveRestore");
            }

        } catch (e) {
            console.error("❌ Queue action failed", e);
            break; // якщо проблема з інтернетом — чекаємо
        }
    }

    saveQueue();
}


/* ------------------------------------------------------------
   4. ГОЛОВНІ ФУНКЦІЇ ДЛЯ ВИКЛИКУ З APP
------------------------------------------------------------ */

/** Викликається кожного разу, коли DATA змінилась */
export function syncAfterChange() {
    if (!IS_ONLINE) {
        queueAction("save");
        saveQueue();
        return;
    }

    // Якщо онлайн — просто збереження
    saveLocal();
}

/** Запуск резервної копії */
export function syncBackup() {
    if (!IS_ONLINE) {
        queueAction("backup");
        saveQueue();
        return;
    }
    return driveBackup();
}

/** Відновлення з бекапу */
export function syncRestore() {
    if (!IS_ONLINE) {
        queueAction("restore");
        saveQueue();
        return;
    }
    return driveRestore();
}


/* ------------------------------------------------------------
   5. Ініціалізація
------------------------------------------------------------ */

export function initSync() {
    loadQueue();
    updateNetworkStatus();
    processQueue();
}