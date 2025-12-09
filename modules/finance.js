/* ============================================================
   MODULE: finance.js
   Фінансова аналітика (FULL ENTERPRISE MODE)
   - Підсумок дня
   - Звіт за період
   - Собівартість яйця
   - Прибуток на 1 птицю
   - Автоматичний перерахунок після кожної зміни
============================================================ */

/* ------------------------------------------------------------
   1. Підрахунок підсумку дня
------------------------------------------------------------ */

function calcDailySummary() {
    const eggs = DATA.eggs || {};
    const feed = DATA.feed || {};

    const dailyIncome = (Number(eggs.traysToday || 0) * Number(eggs.trayPrice || 0));
    const dailyFeedCost = Number(feed.dailyCost || 0);

    DATA.finance.daily = {
        feedCost: dailyFeedCost,
        eggIncome: dailyIncome,
        profit: dailyIncome - dailyFeedCost
    };

    autosave();
}


/* ------------------------------------------------------------
   2. Генерація фінансового звіту за період
------------------------------------------------------------ */

function calcFinanceReport() {
    const period = document.getElementById("reportPeriod")?.value || "30";
    const days = period === "all" ? (DATA.finance.daysLog?.length || 0) : Number(period);

    const dailyLog = DATA.finance.daysLog || [];

    let rep = {
        days: 0,
        eggs: 0,
        trays: 0,
        income: 0,
        feedCost: 0,
        prodAvg: 0,
        profit: 0,
        costPerEgg: 0,
        fullCostPerEgg: 0,
        profitPerEgg: 0,
        profitPerHen: 0
    };

    const hens = Number(DATA.eggs?.hensTotal || 0);
    const otherCost = Number(document.getElementById("otherCostsMonthly")?.value || 0);
    const dailyOtherCost = otherCost / 30;

    const startIndex = Math.max(0, dailyLog.length - days);
    const slice = dailyLog.slice(startIndex);

    for (let d of slice) {
        rep.days += 1;
        rep.eggs += d.eggs;
        rep.trays += d.trays;
        rep.income += d.income;
        rep.feedCost += d.feedCost;
        rep.prodAvg += d.prod || 0;
    }

    if (rep.days > 0) {
        rep.prodAvg = rep.prodAvg / rep.days;
    }

    rep.profit = rep.income - rep.feedCost - (dailyOtherCost * rep.days);

    if (rep.eggs > 0) {
        rep.costPerEgg = rep.feedCost / rep.eggs;
        rep.fullCostPerEgg = (rep.feedCost + (rep.days * dailyOtherCost)) / rep.eggs;
        rep.profitPerEgg = rep.income / rep.eggs - rep.fullCostPerEgg;
    }

    if (hens > 0) {
        rep.profitPerHen = rep.profit / hens;
    }

    DATA.finance.report = rep;
    autosave();
}


/* ------------------------------------------------------------
   3. Збереження щоденного запису для фінансових графіків
------------------------------------------------------------ */

function financeDailyLog() {
    const eggs = DATA.eggs || {};
    const feed = DATA.feed || {};

    if (!DATA.finance.daysLog) DATA.finance.daysLog = [];

    DATA.finance.daysLog.push({
        date: new Date().toISOString().slice(0, 10),
        eggs: Number(eggs.collectedToday || 0),
        trays: Number(eggs.traysToday || 0),
        income: Number(eggs.traysToday || 0) * Number(eggs.trayPrice || 0),
        feedCost: Number(feed.dailyCost || 0),
        prod: Number(eggs.productivity || 0)
    });

    autosave();
}


/* ------------------------------------------------------------
   4. Рендер у HTML (фінансова вкладка)
------------------------------------------------------------ */

function renderFinance() {
    const daily = DATA.finance?.daily || {};
    const rep = DATA.finance?.report || {};

    set("summaryFeedCost", daily.feedCost);
    set("summaryEggIncome", daily.eggIncome);
    set("summaryProfit", daily.profit);

    set("repDays", rep.days);
    set("repEggs", rep.eggs);
    set("repTrays", rep.trays);
    set("repIncome", rep.income.toFixed(2));
    set("repFeedCost", rep.feedCost.toFixed(2));
    set("repProfit", rep.profit.toFixed(2));
    set("repProdAvg", rep.prodAvg.toFixed(1));
    set("repCostPerEgg", rep.costPerEgg.toFixed(3));
    set("repProfitPerEgg", rep.profitPerEgg.toFixed(3));
    set("repProfitPerHen", rep.profitPerHen.toFixed(2));

    const fullCost = rep.fullCostPerEgg?.toFixed(3) || "0.000";
    set("repFullCostPerEgg", fullCost);
}


/* ------------------------------------------------------------
   5. Автоматичний перерахунок при будь-яких змінах
------------------------------------------------------------ */

function financeAutoUpdate() {
    calcDailySummary();
    calcFinanceReport();
    renderFinance();
    autosave();
}


/* ------------------------------------------------------------
   6. Допоміжна функція set()
------------------------------------------------------------ */

function set(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

console.log("finance.js loaded");