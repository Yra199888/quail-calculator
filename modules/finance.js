/* ============================================================
   MODULE: finance.js — FULL ENTERPRISE MODE
   Фінансова аналітика: підсумок дня, звіт, прогноз
   Залежить від:
   - eggs.js (виручка)
   - feed.js (витрати)
   - orders.js (продані лотки)
============================================================ */


/* ------------------------------------------------------------
   1. ПЕРЕРАХУНОК ПІДСУМКУ ДНЯ
------------------------------------------------------------ */

function calcDailySummary() {

    const feedCost = Number(DATA.feed?.dailyCost || 0);
    const eggIncome = Number(DATA.eggs?.dailyIncome || 0);

    DATA.finance.daily = {
        feedCost,
        eggIncome,
        profit: eggIncome - feedCost
    };

    autosave();
}



/* ------------------------------------------------------------
   2. ФІНАНСОВИЙ ЗВІТ ЗА ПЕРІОД
------------------------------------------------------------ */

function calcPeriodReport() {

    const period = document.getElementById("reportPeriod")?.value || "30";

    const logs = DATA.logs || [];
    let days = 0;
    let eggs = 0;
    let trays = 0;
    let income = 0;
    let feedCost = 0;

    const trayPrice = Number(DATA.eggs?.trayPrice || 0);

    // ==== 2.1. Беремо записи останніх X днів ====
    const now = Date.now();

    for (let log of logs) {
        if (!log.time) continue;

        if (period !== "all") {
            const diff = now - log.time;
            const dayMs = 86400000;
            if (diff > Number(period) * dayMs) continue;
        }

        days++;
        eggs += Number(log.eggsCollected || 0);
        trays += Number(log.traysSold || 0);

        income += Number(log.traysSold || 0) * trayPrice;
        feedCost += Number(log.feedCost || 0);
    }

    const avgProd =
        DATA.eggs?.hensTotal > 0
            ? (eggs / DATA.eggs.hensTotal / days) * 100
            : 0;

    const costPerEgg = eggs > 0 ? feedCost / eggs : 0;
    const profit = income - feedCost;

    DATA.finance.report = {
        days,
        eggs,
        trays,
        income,
        feedCost,
        profit,
        avgProd,
        costPerEgg,
        profitPerEgg: eggs ? profit / eggs : 0
    };

    autosave();
}



/* ------------------------------------------------------------
   3. ПРОГНОЗ НА 30 ДНІВ
------------------------------------------------------------ */

function calcForecast() {

    const hens = Number(DATA.eggs?.hensTotal || 0);
    const prod = Number(DATA.eggs?.productivityToday || 0) / 100;
    const trayPrice = Number(DATA.eggs?.trayPrice || 0);
    const feedDaily = Number(DATA.feed?.dailyCost || 0);

    const eggs30 = hens * prod * 30;
    const trays30 = Math.floor(eggs30 / 20);

    const income = trays30 * trayPrice;
    const feedCost = feedDaily * 30;

    DATA.finance.forecast = {
        eggs: eggs30,
        trays: trays30,
        income,
        feedCost,
        profit: income - feedCost
    };

    autosave();
}



/* ------------------------------------------------------------
   4. РЕНДЕР ФІНАНСОВИХ ДАНИХ
------------------------------------------------------------ */

function renderFinance() {

    if (!DATA.finance) return;

    const daily = DATA.finance.daily || {};
    const rep = DATA.finance.report || {};
    const fc = DATA.finance.forecast || {};

    // ==== 9.1 Підсумок дня ====
    setText("summaryFeedCost", daily.feedCost);
    setText("summaryEggIncome", daily.eggIncome);
    setText("summaryProfit", daily.profit);

    // ==== 9.2 Звіт за період ====
    setText("repDays", rep.days);
    setText("repEggs", rep.eggs);
    setText("repTrays", rep.trays);
    setText("repIncome", rep.income);
    setText("repFeedCost", rep.feedCost);
    setText("repProfit", rep.profit);
    setText("repProdAvg", rep.avgProd?.toFixed(1));
    setText("repCostPerEgg", rep.costPerEgg?.toFixed(3));
    setText("repProfitPerEgg", rep.profitPerEgg?.toFixed(3));

    // ==== 9.3 Прогноз ====
    setText("fcastEggs", Math.round(fc.eggs || 0));
    setText("fcastTrays", fc.trays || 0);
    setText("fcastIncome", fc.income || 0);
    setText("fcastFeedCost", fc.feedCost || 0);
    setText("fcastProfit", fc.profit || 0);
}


/* ------------------------------------------------------------
   5. ЗАГАЛЬНИЙ ВИКЛИК ПЕРЕРАХУНКУ
------------------------------------------------------------ */

function financeAutoRecalc() {
    calcDailySummary();
    calcPeriodReport();
    calcForecast();
    renderFinance();
}



/* ------------------------------------------------------------
   6. ХЕЛПЕР
------------------------------------------------------------ */

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}



/* ------------------------------------------------------------
   7. ІНІЦІАЛІЗАЦІЯ МОДУЛЯ
------------------------------------------------------------ */

function initFinance() {
    financeAutoRecalc();
}

initFinance();