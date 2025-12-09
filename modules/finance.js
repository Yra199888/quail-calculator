/* ============================================================
   MODULE: finance.js
   Відповідає за:
   - щоденні підсумки (витрати корму, прибутки від яєць)
   - звіти за період (7 / 30 днів / весь час)
   - автоматичний перерахунок при змінах у eggs.js, feed.js
============================================================ */

/* ------------------------------------------------------------
   1. Розрахунок щоденних показників
------------------------------------------------------------ */

function updateDailySummary() {
    const feedCost = Number(DATA.feed?.dailyCost || 0);
    const eggIncome = Number(DATA.eggs?.income || 0);
    const profit = eggIncome - feedCost;

    DATA.finance.daily = {
        date: new Date().toISOString().split('T')[0],
        feedCost,
        eggIncome,
        profit
    };

    autosave();
    renderFinance();
}

/* ------------------------------------------------------------
   2. Звіт за період
------------------------------------------------------------ */

function recalcReport() {
    const period = document.getElementById("reportPeriod")?.value || "30";
    const days = period === "all" ? DATA.logs.length : Number(period);

    let totalFeed = 0, totalIncome = 0, totalEggs = 0, totalTrays = 0;

    for (let d of (DATA.logs || []).slice(-days)) {
        totalFeed += d.feedCost || 0;
        totalIncome += d.eggIncome || 0;
        totalEggs += d.eggs || 0;
        totalTrays += d.trays || 0;
    }

    const profit = totalIncome - totalFeed - Number(DATA.finance?.otherCostsMonthly || 0);

    DATA.finance.report = {
        days,
        totalFeed,
        totalIncome,
        totalEggs,
        totalTrays,
        profit
    };

    autosave();
    renderFinance();
}

/* ------------------------------------------------------------
   3. Рендер таблиці "Фінанси"
------------------------------------------------------------ */

function renderFinance() {
    const f = DATA.finance || {};
    const rep = f.report || {};

    const elFeed = document.getElementById("summaryFeedCost");
    const elIncome = document.getElementById("summaryEggIncome");
    const elProfit = document.getElementById("summaryProfit");

    if (elFeed) elFeed.textContent = (f.daily?.feedCost || 0).toFixed(2);
    if (elIncome) elIncome.textContent = (f.daily?.eggIncome || 0).toFixed(2);
    if (elProfit) elProfit.textContent = (f.daily?.profit || 0).toFixed(2);

    if (document.getElementById("repDays"))
        document.getElementById("repDays").textContent = rep.days || 0;

    if (document.getElementById("repIncome"))
        document.getElementById("repIncome").textContent = rep.totalIncome?.toFixed(2) || 0;

    if (document.getElementById("repFeedCost"))
        document.getElementById("repFeedCost").textContent = rep.totalFeed?.toFixed(2) || 0;

    if (document.getElementById("repProfit"))
        document.getElementById("repProfit").textContent = rep.profit?.toFixed(2) || 0;
}

/* ------------------------------------------------------------
   4. Автоматичне оновлення після змін
------------------------------------------------------------ */

function financeAutoUpdate() {
    updateDailySummary();
    recalcReport();
    autosave();
}