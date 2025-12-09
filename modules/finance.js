/* ============================================================
   MODULE: finance.js  (FULL ENTERPRISE MODE)
   Відповідає за:
   - Підрахунок щоденної економіки
   - Підсумок за період
   - Розрахунок прибутків / витрат
   - Вартість яйця, лотка, курки
   - Інтеграцію з feed.js, eggs.js, orders.js
============================================================ */

import { DATA } from "../core/data.js";
import { autosave } from "../core/storage.js";
import { renderFinance } from "./render.js";

/* ------------------------------------------------------------
   1. ОНОВЛЕННЯ ЩОДЕННИХ ПОКАЗНИКІВ
------------------------------------------------------------ */
export function updateDailyFinance() {
    const eggs = DATA.eggs || {};
    const feed = DATA.feed || {};

    const trays = Number(eggs.trays || 0);
    const trayPrice = Number(eggs.trayPrice || 0);
    const income = trays * trayPrice;

    const feedCost = Number(feed.dailyFeedCost || 0);

    DATA.finance.dailyFeedCost = feedCost;
    DATA.finance.dailyIncome = income;
    DATA.finance.dailyProfit = income - feedCost;

    autosave();
    renderFinance();
}

/* ------------------------------------------------------------
   2. ЗВІТ ЗА ПЕРІОД (7 днів / 30 днів / весь час)
------------------------------------------------------------ */
export function recalcReport() {
    const period = document.getElementById("reportPeriod").value;
    const days = period === "all" ? DATA.logs.length : Number(period);

    let repEggs = 0;
    let repTrays = 0;
    let repIncome = 0;
    let repFeedCost = 0;

    const trayPrice = Number(DATA.eggs.trayPrice || 0);

    // Беремо останні N днів
    const logs = DATA.logs.slice(-days);

    for (let l of logs) {
        repEggs += Number(l.eggs || 0);
        repTrays += Number(l.trays || 0);
        repIncome += Number(l.trays || 0) * trayPrice;
        repFeedCost += Number(l.feedCost || 0);
    }

    const hens = Number(DATA.eggs.hensTotal || 0);

    const repProfit = repIncome - repFeedCost;

    // Додаткові параметри
    const prodAvg = hens ? (repEggs / hens / days) * 100 : 0;
    const costPerEgg = repEggs ? repFeedCost / repEggs : 0;
    const profitPerEgg = repEggs ? repProfit / repEggs : 0;

    // Загальні витрати (ін.витрати)
    const other = Number(document.getElementById("otherCostsMonthly").value || 0);
    const repFullCostPerEgg = repEggs ? (repFeedCost + other) / repEggs : 0;
    const repProfitPerEggFull = repEggs ? repIncome / repEggs - repFullCostPerEgg : 0;

    DATA.finance.repDays = days;
    DATA.finance.repEggs = repEggs;
    DATA.finance.repTrays = repTrays;
    DATA.finance.repIncome = repIncome;
    DATA.finance.repFeedCost = repFeedCost;
    DATA.finance.repProfit = repProfit;
    DATA.finance.repProdAvg = prodAvg;
    DATA.finance.repCostPerEgg = costPerEgg;
    DATA.finance.repProfitPerEgg = profitPerEgg;
    DATA.finance.repOtherCost = other;
    DATA.finance.repFullCostPerEgg = repFullCostPerEgg;
    DATA.finance.repProfitPerEggFull = repProfitPerEggFull;

    autosave();
    renderFinance();
}

/* ------------------------------------------------------------
   3. ЛОГІКА ДЛЯ ДОДАВАННЯ ЩОДЕННОГО ЗАПИСУ
------------------------------------------------------------ */
export function addFinanceLog() {
    const eggs = DATA.eggs || {};
    const feed = DATA.feed || {};

    const entry = {
        date: new Date().toISOString().slice(0, 10),
        eggs: Number(eggs.todayTotal || 0),
        trays: Number(eggs.trays || 0),
        feedCost: Number(feed.dailyFeedCost || 0)
    };

    DATA.logs.push(entry);

    autosave();
    recalcReport();
}

/* ------------------------------------------------------------
   4. ПУБЛІЧНІ ФУНКЦІЇ ДЛЯ ЗАПУСКУ ФІНАНСОВОГО МОДУЛЯ
------------------------------------------------------------ */

export function initFinanceModule() {
    // Події UI
    const otherCosts = document.getElementById("otherCostsMonthly");
    if (otherCosts) otherCosts.oninput = recalcReport;

    recalcReport();
    updateDailyFinance();
}

/* ------------------------------------------------------------
   5. ЕКСПОРТ
------------------------------------------------------------ */

export default {
    updateDailyFinance,
    recalcReport,
    addFinanceLog,
    initFinanceModule
};