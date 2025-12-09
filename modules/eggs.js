/* ============================================================
   MODULE: EGGS — FULL ENTERPRISE MODE
   Працює із DATA.eggs та глобальним autosave(), renderAll()
============================================================ */

/* ---------- 0. Ініціалізація структури DATA ---------- */

if (!DATA.eggs) {
    DATA.eggs = {
        today: {
            total: 0,
            bad: 0,
            own: 0,
            carry: 0
        },
        hens: {
            batch1: 0,
            batch2: 0
        },
        history: [],   // [{date, total, bad, own, forSale, trays}]
        metrics: {
            forSale: 0,
            totalSale: 0,
            trays: 0,
            remainder: 0,
            income: 0,
            productivity: 0
        }
    };
}

/* ------------------------------------------------------------
   1. Отримання значень з форми
------------------------------------------------------------ */

function readEggInputs() {
    const e = DATA.eggs;

    e.today.total  = Number(document.getElementById("eggsTotal").value) || 0;
    e.today.bad    = Number(document.getElementById("eggsBad").value) || 0;
    e.today.own    = Number(document.getElementById("eggsOwn").value) || 0;
    e.today.carry  = Number(document.getElementById("eggsCarry").value) || 0;

    e.hens.batch1 = Number(document.getElementById("hens1").value) || 0;
    e.hens.batch2 = Number(document.getElementById("hens2").value) || 0;

    e.trayPrice = Number(document.getElementById("trayPrice").value) || 0;

    return e;
}

/* ------------------------------------------------------------
   2. Розрахунок балансу яєць
------------------------------------------------------------ */

function calcEggBalance() {
    const e = DATA.eggs;
    const t = e.today;

    const available = (t.total - t.bad - t.own);
    const forSaleToday = Math.max(available, 0);

    const totalForSale = forSaleToday + t.carry;

    const trays = Math.floor(totalForSale / 20);
    const remainder = totalForSale % 20;

    const income = trays * (e.trayPrice || 0);

    e.metrics.forSale = forSaleToday;
    e.metrics.totalSale = totalForSale;
    e.metrics.trays = trays;
    e.metrics.remainder = remainder;
    e.metrics.income = income;
}

/* ------------------------------------------------------------
   3. Розрахунок продуктивності
------------------------------------------------------------ */

function calcProductivity() {
    const e = DATA.eggs;
    const totalHens = e.hens.batch1 + e.hens.batch2;

    let productiveEggs = Math.max(e.today.total - e.today.bad, 0);

    let percent = totalHens > 0 ? (productiveEggs / totalHens) * 100 : 0;

    e.metrics.productivity = percent.toFixed(1);
}

/* ------------------------------------------------------------
   4. Додавання в історію дня
------------------------------------------------------------ */

function pushEggHistory() {
    const e = DATA.eggs;

    const todayStr = new Date().toISOString().slice(0, 10);

    e.history.push({
        date: todayStr,
        total: e.today.total,
        bad: e.today.bad,
        own: e.today.own,
        carry: e.today.carry,
        forSale: e.metrics.forSale,
        trays: e.metrics.trays
    });

    if (e.history.length > 1200) {
        e.history.shift();
    }
}

/* ------------------------------------------------------------
   5. Головна функція перерахунку
------------------------------------------------------------ */

function recalcEggs() {
    readEggInputs();
    calcEggBalance();
    calcProductivity();
    autosave();
    renderEggs();
    renderFinance(); // оновлення фінансових даних
}

/* ------------------------------------------------------------
   6. Відображення UI
------------------------------------------------------------ */

function renderEggs() {
    const e = DATA.eggs;
    const m = e.metrics;

    // Баланс
    document.getElementById("eggsForSale").textContent = m.forSale;
    document.getElementById("eggsForSaleTotal").textContent = m.totalSale;
    document.getElementById("traysCount").textContent = m.trays;
    document.getElementById("eggsRemainder").textContent = m.remainder;
    document.getElementById("income").textContent = m.income.toFixed(2);

    // Продуктивність
    const hensTotal = e.hens.batch1 + e.hens.batch2;
    document.getElementById("hensTotal").textContent = hensTotal;
    document.getElementById("productivityToday").textContent = m.productivity;

    // Підсумок по лотках
    document.getElementById("totalTraysTodayLabel").textContent = m.trays;

    // Заброньовані / Вільні — бере з ORDERS MODULE
    if (typeof calcFreeTrays === "function") {
        calcFreeTrays();
    }
}

/* ------------------------------------------------------------
   7. Події
------------------------------------------------------------ */

document.getElementById("eggsTotal").oninput = recalcEggs;
document.getElementById("eggsBad").oninput = recalcEggs;
document.getElementById("eggsOwn").oninput = recalcEggs;
document.getElementById("eggsCarry").oninput = recalcEggs;

document.getElementById("hens1").oninput = recalcEggs;
document.getElementById("hens2").oninput = recalcEggs;

document.getElementById("trayPrice").oninput = recalcEggs;

/* ------------------------------------------------------------
   8. Ініціалізація
------------------------------------------------------------ */

recalcEggs();
console.log("EGGS MODULE LOADED");