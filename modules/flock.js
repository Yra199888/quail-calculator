/* ============================================================
   MODULE: flock.js  
   Поголів’я (FULL ENTERPRISE MODE)

   Функціонал:
   - облік кількості самців / самок
   - смертність
   - середній вік
   - автоматичний підрахунок загальної кількості
   - інтеграція з DATA
   - autosave + offline sync
   - виклик renderFlock() у render.js
============================================================ */

import { DATA, autosave } from "../core/storage.js";
import { syncQueuePush } from "../core/sync.js";
import { renderFlock } from "./render.js";

/* ------------------------------------------------------------
   1. Ініціалізація структури DATA.flock
------------------------------------------------------------ */

export function initFlockModule() {
    if (!DATA.flock) {
        DATA.flock = {
            males: 0,
            females: 0,
            deaths: 0,
            avgAge: 0,
            total: 0
        };
    }

    // Під'єднуємо інпут-поля
    bindUI();
    updateFlock();
}

/* ------------------------------------------------------------
   2. Прив’язка UI → логіка
------------------------------------------------------------ */

function bindUI() {
    const ids = ["males", "females", "deaths", "avgAge"];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener("input", updateFlock);
        }
    });
}

/* ------------------------------------------------------------
   3. Основна логіка оновлення поголів’я
------------------------------------------------------------ */

export function updateFlock() {
    try {
        const males   = Number(document.getElementById("males")?.value || 0);
        const females = Number(document.getElementById("females")?.value || 0);
        const deaths  = Number(document.getElementById("deaths")?.value || 0);
        const avgAge  = Number(document.getElementById("avgAge")?.value || 0);

        DATA.flock.males = males;
        DATA.flock.females = females;
        DATA.flock.deaths = deaths;
        DATA.flock.avgAge = avgAge;

        // Загальна кількість
        DATA.flock.total = Math.max(males + females - deaths, 0);

        autosave();
        syncQueuePush("flock_update", DATA.flock);

        renderFlock();
    }
    catch (err) {
        console.error("updateFlock() error:", err);
    }
}

/* ------------------------------------------------------------
   4. Експорт для глобального виклику
------------------------------------------------------------ */

export default {
    initFlockModule,
    updateFlock
};