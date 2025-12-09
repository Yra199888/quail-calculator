/* ============================================================
   MODULE: logs.js  — фінансовий щоденник витрат/доходів
   Відповідає за:
   - додавання записів (корм, інкубація, обладнання тощо)
   - видалення записів
   - перерахунок загальних витрат
   - синхронізацію через autosave()
============================================================ */

import { DATA } from "../core/data.js";
import { autosave } from "../core/storage.js";
import { pushSyncEvent } from "../core/sync.js";
import { renderLogs, renderFinance } from "./render.js";

/* ------------------------------------------------------------
   1. Ініціалізація структури
------------------------------------------------------------ */
export function initLogsModule() {
    if (!DATA.logs) DATA.logs = [];
}

/* ------------------------------------------------------------
   2. Додати запис
------------------------------------------------------------ */
export function addLog() {
    const date = document.getElementById("logDate").value;
    const category = document.getElementById("logCategory").value;
    const amount = Number(document.getElementById("logAmount").value);
    const comment = document.getElementById("logComment").value;

    if (!date || !category || !amount) {
        alert("Заповни дату, категорію і суму!");
        return;
    }

    const newLog = {
        id: Date.now(),
        date,
        category,
        amount,
        comment
    };

    DATA.logs.push(newLog);

    autosave();
    pushSyncEvent("logs:add", newLog);

    renderLogs();
    renderFinance();
}

/* ------------------------------------------------------------
   3. Видалити запис
------------------------------------------------------------ */
export function deleteLog(id) {
    DATA.logs = DATA.logs.filter(l => l.id !== id);

    autosave();
    pushSyncEvent("logs:delete", { id });

    renderLogs();
    renderFinance();
}

/* ------------------------------------------------------------
   4. Порахувати загальні витрати
------------------------------------------------------------ */
export function calculateTotalCosts() {
    return DATA.logs.reduce((sum, l) => sum + Number(l.amount || 0), 0);
}

/* ------------------------------------------------------------
   5. Експорт для інших модулів
------------------------------------------------------------ */
export function getLogs() {
    return DATA.logs || [];
}