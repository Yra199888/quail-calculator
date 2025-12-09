/* ============================================================
   MODULE: EGGS / ЯЙЦЯ
   FULL ENTERPRISE MODE — Модульна система (М1)
   Автор: ChatGPT для Юрія
============================================================ */

/* ------------------------------------------------------------
   1. ІНІЦІАЛІЗАЦІЯ ПОСИЛАНЬ НА ЕЛЕМЕНТИ
------------------------------------------------------------ */

const EG = {
    total: document.getElementById("eggsTotal"),
    bad: document.getElementById("eggsBad"),
    own: document.getElementById("eggsOwn"),
    carry: document.getElementById("eggsCarry"),

    forSale: document.getElementById("eggsForSale"),
    forSaleTotal: document.getElementById("eggsForSaleTotal"),
    traysCount: document.getElementById("traysCount"),
    eggsRemainder: document.getElementById("eggsRemainder"),
    trayPrice: document.getElementById("trayPrice"),
    income: document.getElementById("income"),

    hens1: document.getElementById("hens1"),
    hens2: document.getElementById("hens2"),

    hensTotal: document.getElementById("hensTotal"),
    productivityToday: document.getElementById("productivityToday"),

    traysTodayLabel: document.getElementById("totalTraysTodayLabel"),
    reservedTrays: document.getElementById("reservedTrays"),
    freeTrays: document.getElementById("freeTrays"),
};


/* ------------------------------------------------------------
   2. ГОЛОВНИЙ ОНOВЛЮВАЧ
------------------------------------------------------------ */

function updateEggs() {
    recalcEggsBalance();
    recalcProductivity();
    calcTraysSummary();
}


/* ------------------------------------------------------------
   3. РОЗРАХУНОК БАЛАНСУ ЯЄЦЬ
------------------------------------------------------------ */

function recalcEggsBalance() {

    const total = Number(EG.total.value) || 0;
    const bad = Number(EG.bad.value) || 0;
    const own = Number(EG.own.value) || 0;
    const carry = Number(EG.carry.value) || 0;

    const goodToday = total - bad;
    const saleToday = goodToday - own;

    const saleTotal = saleToday + carry;

    const trays = Math.floor(saleTotal / 20);
    const remainder = saleTotal % 20;

    const trayPrice = Number(EG.trayPrice.value) || 0;
    const income = trays * trayPrice;

    // Запис у DATA
    DATA.eggs = {
        total, bad, own, carry,
        saleToday,
        saleTotal,
        trays,
        remainder,
        incomeToday: income
    };

    // Відображення
    EG.forSale.textContent = saleToday;
    EG.forSaleTotal.textContent = saleTotal;
    EG.traysCount.textContent = trays;
    EG.eggsRemainder.textContent = remainder;
    EG.income.textContent = income.toFixed(2);

    autosave();
}


/* ------------------------------------------------------------
   4. ПРОДУКТИВНІСТЬ
------------------------------------------------------------ */

function recalcProductivity() {

    const hens1 = Number(EG.hens1.value) || 0;
    const hens2 = Number(EG.hens2.value) || 0;
    const hensTotal = hens1 + hens2;

    const totalEggs = Number(EG.total.value) || 0;

    const prod =
        hensTotal > 0
            ? (totalEggs / hensTotal) * 100
            : 0;

    // UPDATE DATA
    DATA.eggs.hens1 = hens1;
    DATA.eggs.hens2 = hens2;
    DATA.eggs.hensTotal = hensTotal;
    DATA.eggs.productivity = prod;

    // RENDER
    EG.hensTotal.textContent = hensTotal;
    EG.productivityToday.textContent = prod.toFixed(1);

    autosave();
}


/* ------------------------------------------------------------
   5. РОЗРАХУНОК ЛОТКІВ З УРАХУВАННЯМ ЗАМОВЛЕНЬ
------------------------------------------------------------ */

function calcTraysSummary() {

    const traysTotal = DATA.eggs.trays || 0;

    // Скільки лотків заброньовано замовленнями
    const reserved =
        DATA.orders.filter(o => !o.done)
                   .reduce((sum, o) => sum + (o.trays || 0), 0);

    const free = Math.max(traysTotal - reserved, 0);

    DATA.eggs.reserved = reserved;
    DATA.eggs.free = free;

    EG.traysTodayLabel.textContent = traysTotal;
    EG.reservedTrays.textContent = reserved;
    EG.freeTrays.textContent = free;

    autosave();
}


/* ------------------------------------------------------------
   6. РЕНДЕР МОДУЛЯ
------------------------------------------------------------ */

function renderEggs() {

    // Якщо DATA порожній — не ломати інтерфейс
    if (!DATA.eggs) return;

    EG.total.value = DATA.eggs.total ?? 0;
    EG.bad.value = DATA.eggs.bad ?? 0;
    EG.own.value = DATA.eggs.own ?? 0;
    EG.carry.value = DATA.eggs.carry ?? 0;

    EG.forSale.textContent = DATA.eggs.saleToday ?? 0;
    EG.forSaleTotal.textContent = DATA.eggs.saleTotal ?? 0;
    EG.traysCount.textContent = DATA.eggs.trays ?? 0;
    EG.eggsRemainder.textContent = DATA.eggs.remainder ?? 0;
    EG.income.textContent = (DATA.eggs.incomeToday ?? 0).toFixed(2);

    EG.hens1.value = DATA.eggs.hens1 ?? 0;
    EG.hens2.value = DATA.eggs.hens2 ?? 0;
    EG.hensTotal.textContent = DATA.eggs.hensTotal ?? 0;

    EG.productivityToday.textContent =
        (DATA.eggs.productivity ?? 0).toFixed(1);

    EG.reservedTrays.textContent = DATA.eggs.reserved ?? 0;
    EG.freeTrays.textContent = DATA.eggs.free ?? 0;

    EG.trayPrice.value = DATA.eggs.trayPrice ?? EG.trayPrice.value;
}


/* ------------------------------------------------------------
   7. ЕКСПОРТ ФУНКЦІЙ МОДУЛЯ
------------------------------------------------------------ */

window.updateEggs = updateEggs;
window.recalcEggsBalance = recalcEggsBalance;
window.recalcProductivity = recalcProductivity;
window.calcTraysSummary = calcTraysSummary;
window.renderEggs = renderEggs;