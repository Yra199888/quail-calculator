/* ============================================================
   MODULE: finance.js
   Відповідає за:
   - 9.1 Підсумок дня (корм + яйця)
   - 9.2 Фінансовий звіт за період
   - 9.3 Прогноз на 30 днів
   - Автоматичну інтеграцію з eggs.js / feed.js / orders.js
============================================================ */


/* ------------------------------------------------------------
   1. ПІДСУМОК ДНЯ (9.1)
------------------------------------------------------------ */

function financeDailySummary() {
    const trayPrice = Number(DATA.eggs?.trayPrice || 0);
    const traysToday = Number(DATA.eggs?.traysToday || 0);
    const dailyIncome = traysToday * trayPrice;

    const dailyFeedCost = Number(DATA.feed?.dailyCost || 0);

    const profit = dailyIncome - dailyFeedCost;

    DATA.finance.daily = {
        feedCost: dailyFeedCost,
        eggIncome: dailyIncome,
        profit: profit
    };

    autosave();
    return DATA.finance.daily;
}


/* ------------------------------------------------------------
   2. ЗВІТ ЗА ПЕРІОД (9.2)
------------------------------------------------------------ */

function financeReport(periodDays) {

    const logs = DATA.logs || [];
    const eggsHistory = DATA.eggs?.history || [];
    const trayPrice = Number(DATA.eggs?.trayPrice || 0);

    let totalEggs = 0;
    let totalTrays = 0;
    let totalIncome = 0;
    let totalFeedCost = 0;
    let totalProductivity = 0;
    let daysCount = 0;

    // Вибірка періоду
    const now = Date.now();
    const periodMs = periodDays === "all" ? Infinity : periodDays * 86400000;

    for (let d of eggsHistory) {
        const dayTime = new Date(d.date).getTime();
        if (now - dayTime > periodMs) continue;

        daysCount++;

        totalEggs += Number(d.eggsTotal || 0);
        totalTrays += Number(d.trays || 0);
        totalIncome += Number(d.trays || 0) * trayPrice;
        totalFeedCost += Number(d.feedCost || 0);
        totalProductivity += Number(d.productivity || 0);
    }

    const avgProd = daysCount > 0 ? totalProductivity / daysCount : 0;
    const costPerEgg = totalEggs > 0 ? totalFeedCost / totalEggs : 0;
    const profit = totalIncome - totalFeedCost;

    DATA.finance.report = {
        days: daysCount,
        eggs: totalEggs,
        trays: totalTrays,
        income: totalIncome,
        feedCost: totalFeedCost,
        profit: profit,
        prodAvg: avgProd,
        costPerEgg: costPerEgg
    };

    autosave();
    return DATA.finance.report;
}



/* ------------------------------------------------------------
   3. ПРОГНОЗ НА 30 ДНІВ (9.3)
------------------------------------------------------------ */

function financeForecast30() {
    const hens = Number(DATA.eggs?.hensTotal || 0);
    const prod = Number(DATA.eggs?.productivityToday || 0); // %
    const trayPrice = Number(DATA.eggs?.trayPrice || 0);
    const dailyFeedCost = Number(DATA.feed?.dailyCost || 0);

    // Прогноз: яєць на день
    const eggsPerDay = hens * (prod / 100);
    const traysPerDay = eggsPerDay / 20;

    const eggs30 = eggsPerDay * 30;
    const trays30 = traysPerDay * 30;
    const income30 = trays30 * trayPrice;
    const feedCost30 = dailyFeedCost * 30;
    const profit30 = income30 - feedCost30;

    DATA.finance.forecast = {
        eggs: eggs30,
        trays: trays30,
        income: income30,
        feedCost: feedCost30,
        profit: profit30
    };

    autosave();
    return DATA.finance.forecast;
}


/* ------------------------------------------------------------
   4. ГОЛОВНИЙ РЕНДЕР СЕКЦІЇ "ФІНАНСИ"
------------------------------------------------------------ */

function renderFinance() {
    // ПІДСУМОК ДНЯ
    const day = financeDailySummary();
    setText("summaryFeedCost", day.feedCost?.toFixed(2));
    setText("summaryEggIncome", day.eggIncome?.toFixed(2));
    setText("summaryProfit", day.profit?.toFixed(2));

    // ЗВІТ ЗА ПЕРІОД
    const period = document.getElementById("reportPeriod").value;
    const report = financeReport(period === "all" ? "all" : Number(period));

    setText("repDays", report.days);
    setText("repEggs", report.eggs);
    setText("repTrays", report.trays);
    setText("repIncome", report.income.toFixed(2));
    setText("repFeedCost", report.feedCost.toFixed(2));
    setText("repProfit", report.profit.toFixed(2));
    setText("repProdAvg", report.prodAvg.toFixed(1));
    setText("repCostPerEgg", report.costPerEgg.toFixed(3));

    // ПРОГНОЗ 30 ДНІВ
    const fc = financeForecast30();
    setText("fcastEggs", fc.eggs.toFixed(0));
    setText("fcastTrays", fc.trays.toFixed(1));
    setText("fcastIncome", fc.income.toFixed(2));
    setText("fcastFeedCost", fc.feedCost.toFixed(2));
    setText("fcastProfit", fc.profit.toFixed(2));

    autosave();
}


/* ------------------------------------------------------------
   5. Допоміжна функція (як у feed.js/eggs.js)
------------------------------------------------------------ */

function setText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
}

console.log("finance.js loaded");