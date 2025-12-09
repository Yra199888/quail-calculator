/* ============================================================
   APP.JS — ГОЛОВНИЙ ФАЙЛ (M1 STRUCTURE + PRO MODE)
   Підключає ядро, модулі, запускає ініціалізацію
============================================================ */

/* -----------------------------
   1. ГЛОБАЛЬНИЙ ОБ’ЄКТ ДАНИХ
----------------------------- */

window.DATA = {}; // буде завантажено з core/data.js


/* -------------------------------------------------------------
   2. ІМПОРТ ЯДРА (CORE)
   — збереження
   — autosave
   — offline queue
   — Google Drive backup
   — PWA статус
------------------------------------------------------------- */

import "./core/data.js";
import { loadLocal, saveLocal, autosave } from "./core/storage.js";
import { syncIfOnline, queueChange } from "./core/sync.js";
import {
    driveInit,
    driveBackup,
    driveRestore
} from "./core/drive.js";
import { initPWAStatus } from "./core/pwa.js";


/* -------------------------------------------------------------
   3. ІМПОРТ МОДУЛІВ (modules/)
------------------------------------------------------------- */
import { feedInit, feedRender } from "./modules/feed.js";
import { eggsInit, eggsRender } from "./modules/eggs.js";
import { ordersInit, ordersRender } from "./modules/orders.js";
import { clientsInit, renderClients } from "./modules/clients.js";
import { financeInit, financeRender } from "./modules/finance.js";
import { incubInit, incubRender } from "./modules/incub.js";
import { flockInit, flockRender } from "./modules/flock.js";
import { logsInit, logsRender } from "./modules/logs.js";
import { renderAll } from "./modules/render.js";


/* -------------------------------------------------------------
   4. ГОЛОВНИЙ СТАРТ ДОДАТКУ
------------------------------------------------------------- */

async function appInit() {
    console.log("🚀 Quail Calculator PRO MODE запускається...");

    // 1. Завантаження локальних даних
    await loadLocal();

    // 2. Ініціалізація PWA статусу (online/offline)
    initPWAStatus();

    // 3. Ініціалізація Google Drive API
    driveInit();

    // 4. Ініціалізація модулів
    feedInit();
    eggsInit();
    ordersInit();
    clientsInit();
    financeInit();
    incubInit();
    flockInit();
    logsInit();

    // 5. Рендер всіх секцій одразу
    renderAll();

    // 6. Якщо є інтернет — зробити авто-синхронізацію
    syncIfOnline();

    console.log("✅ Quail Calculator PRO MODE — Готово!");
}

appInit();



/* -------------------------------------------------------------
   5. КНОПКИ ІЗ ГОЛОВНОГО МЕНЮ
------------------------------------------------------------- */

document.getElementById("saveLocal")?.addEventListener("click", () => {
    saveLocal();
    alert("Дані збережено локально ✔");
});

document.getElementById("backupDrive")?.addEventListener("click", async () => {
    await driveBackup();
});

document.getElementById("restoreDrive")?.addEventListener("click", async () => {
    await driveRestore();
    renderAll();
});


/* -------------------------------------------------------------
   6. РЕАКЦІЯ НА ЗМІНИ ДАНИХ (AUTOSAVE + QUEUE)
------------------------------------------------------------- */

window.DATA_CHANGED = function () {
    autosave();         // зберегти локально
    queueChange();      // поставити в чергу для онлайн-синхронізації
};