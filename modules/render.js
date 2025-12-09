/* ============================================================
   MODULE: render.js
   Оновлення інтерфейсу (UI) для всіх секцій
   Викликається після:
   - зміни DATA
   - autosave()
   - відновлення з бекапу
   - початкового завантаження
============================================================ */

/* ------------------------------------------------------------
   1. РЕНДЕР КОРМУ (feed)
------------------------------------------------------------ */

function renderFeed() {
    try {
        if (!DATA.feed) return;

        // === 3.4 Залишок комбікорму ===
        const ready = Number(DATA.feed.ready || 0);
        const daily = Number(DATA.feed.dailyNeed || 0);

        setHTML("feedReadyStock", ready.toFixed(2));
        setHTML("feedStockRemain", ready.toFixed(2));
        setHTML("feedDaysLeft", daily > 0 ? Math.floor(ready / daily) : 0);

        // === 3.3 Таблиця запасів компонентів ===
        const stock = DATA.feed.stock || {};
        const need = DATA.feed.need || {};

        let htmlStock = "";
        for (let key in stock) {
            const have = Number(stock[key] || 0);
            const req = Number(need[key] || 0);
            const buy = Math.max(req - have, 0);

            htmlStock += `
                <tr>
                    <td>${key}</td>
                    <td>${have}</td>
                    <td>${req}</td>
                    <td>${buy}</td>
                </tr>
            `;
        }
        setHTML("stockRows", htmlStock);

        // === 3.5 Мені треба купити ===
        let buyList = "";
        for (let key in stock) {
            const have = Number(stock[key] || 0);
            const req = Number(need[key] || 0);
            if (req > have) {
                buyList += `<li>${key}: потрібно докупити ${req - have} кг</li>`;
            }
        }

        setHTML("buySummary", buyList || "<li>Все є ✔</li>");
    }
    catch (e) {
        console.error("Помилка renderFeed()", e);
    }
}


/* ------------------------------------------------------------
   2. РЕНДЕР ЯЄЦЬ (eggs)
------------------------------------------------------------ */

function renderEggs() {
    try {
        const e = DATA.eggs || {};

        setHTML("eggsForSale", e.todayForSale || 0);
        setHTML("eggsForSaleTotal", e.totalForSale || 0);
        setHTML("traysCount", e.trays || 0);
        setHTML("eggsRemainder", e.remainder || 0);
        setHTML("income", (e.income || 0).toFixed(2));

        // Продуктивність
        setHTML("hensTotal", e.hensTotal || 0);
        setHTML("productivityToday", (e.productivity || 0).toFixed(1));

        // Підсумок по лотках
        setHTML("totalTraysTodayLabel", e.trays || 0);
        setHTML("reservedTrays", e.reservedTrays || 0);
        setHTML("freeTrays", e.freeTrays || 0);
    }
    catch (e) {
        console.error("Помилка renderEggs()", e);
    }
}


/* ------------------------------------------------------------
   3. РЕНДЕР ЗАМОВЛЕНЬ (orders)
------------------------------------------------------------ */

function renderOrders() {
    try {
        const active = DATA.orders.filter(o => !o.done);
        const done = DATA.orders.filter(o => o.done);

        let htmlActive = "";
        let htmlDone = "";

        for (let o of active) {
            htmlActive += `
                <tr>
                    <td>${o.name}</td>
                    <td>${o.trays} лотків</td>
                    <td>${o.date}</td>
                    <td>${o.note || ""}</td>
                    <td><button onclick="completeOrder(${o.id})">✔</button></td>
                </tr>
            `;
        }

        for (let o of done) {
            htmlDone += `
                <tr>
                    <td>${o.name}</td>
                    <td>${o.trays} лотків</td>
                    <td>${o.date}</td>
                    <td>${o.note || ""}</td>
                    <td>✓</td>
                </tr>
            `;
        }

        setHTML("ordersActive", htmlActive);
        setHTML("ordersDone", htmlDone);
    }
    catch (e) {
        console.error("renderOrders() error", e);
    }
}


/* ------------------------------------------------------------
   4. РЕНДЕР КЛІЄНТІВ (clients)
------------------------------------------------------------ */

function renderClients() {
    try {
        const table = document.getElementById("clientsBody");
        if (!table) return;

        const list = Object.values(DATA.clients || {});
        let html = "";

        for (let c of list) {
            html += `
                <tr>
                    <td>${c.name}</td>
                    <td>${c.orders}</td>
                    <td>${c.trays}</td>
                    <td>${c.eggs}</td>
                    <td>${c.income.toFixed(2)} грн</td>
                    <td>${c.lastDate}</td>
                </tr>
            `;
        }

        table.innerHTML = html;
    }
    catch (e) {
        console.error("renderClients() error", e);
    }
}


/* ------------------------------------------------------------
   5. РЕНДЕР ФІНАНСІВ (finance)
------------------------------------------------------------ */

function renderFinance() {
    try {
        const f = DATA.finance || {};

        setHTML("summaryFeedCost", (f.dailyFeedCost || 0).toFixed(2));
        setHTML("summaryEggIncome", (f.dailyIncome || 0).toFixed(2));
        setHTML("summaryProfit", (f.dailyProfit || 0).toFixed(2));

        setHTML("repDays", f.repDays || 0);
        setHTML("repEggs", f.repEggs || 0);
        setHTML("repTrays", f.repTrays || 0);
        setHTML("repIncome", (f.repIncome || 0).toFixed(2));
        setHTML("repFeedCost", (f.repFeedCost || 0).toFixed(2));
        setHTML("repProfit", (f.repProfit || 0).toFixed(2));
        setHTML("repProdAvg", (f.repProdAvg || 0).toFixed(1));
        setHTML("repCostPerEgg", (f.repCostPerEgg || 0).toFixed(3));
        setHTML("repProfitPerEgg", (f.repProfitPerEgg || 0).toFixed(3));
        setHTML("repProfitPerHen", (f.repProfitPerHen || 0).toFixed(2));
        setHTML("repOtherCost", (f.repOtherCost || 0).toFixed(2));
        setHTML("repFullCostPerEgg", (f.repFullCostPerEgg || 0).toFixed(3));
        setHTML("repProfitPerEggFull", (f.repProfitPerEggFull || 0).toFixed(3));
    }
    catch (e) {
        console.error("renderFinance() error", e);
    }
}


/* ------------------------------------------------------------
   6. РЕНДЕР ІНКУБАЦІЇ (incub)
------------------------------------------------------------ */

function renderInc() {
    try {
        const body = document.getElementById("incubationBody");
        if (!body) return;

        let html = "";
        for (let inc of DATA.incub) {
            html += `
                <tr>
                    <td>${inc.name}</td>
                    <td>${inc.start}</td>
                    <td>${inc.days || 0}</td>
                    <td>${inc.eggs}</td>
                    <td>${inc.infertile}</td>
                    <td>${inc.hatched}</td>
                    <td>${inc.diedInc}</td>
                    <td>${inc.diedBrooder}</td>
                    <td>${inc.eggs - inc.infertile - inc.diedInc - inc.diedBrooder}</td>
                    <td>—</td>
                    <td>${inc.note || ""}</td>
                    <td>…</td>
                </tr>
            `;
        }

        body.innerHTML = html;
    }
    catch (e) {
        console.error("renderInc() error", e);
    }
}


/* ------------------------------------------------------------
   7. РЕНДЕР ПОГОЛІВ’Я (flock)
------------------------------------------------------------ */

function renderFlock() {
    try {
        const f = DATA.flock || {};
        setHTML("flockTotal", (f.males || 0) + (f.females || 0) - (f.deaths || 0));
    }
    catch (e) {
        console.error("renderFlock() error", e);
    }
}


/* ------------------------------------------------------------
   8. РЕНДЕР ЛОГІВ (logs)
------------------------------------------------------------ */

function renderLogs() {
    try {
        const body = document.getElementById("logBody");
        if (!body) return;

        let html = "";
        for (let l of DATA.logs) {
            html += `
                <tr>
                    <td>${l.date}</td>
                    <td>${l.category}</td>
                    <td>${l.amount} грн</td>
                    <td>${l.comment || ""}</td>
                    <td><button onclick="deleteLog(${l.id})">🗑</button></td>
                </tr>
            `;
        }
        body.innerHTML = html;
    }
    catch (e) {
        console.error("renderLogs() error", e);
    }
}


/* ------------------------------------------------------------
   9. ГЛОБАЛЬНИЙ РЕНДЕР
------------------------------------------------------------ */

function renderAll() {
    renderFeed();
    renderEggs();
    renderOrders();
    renderClients();
    renderFinance();
    renderInc();
    renderFlock();
    renderLogs();
}


/* ------------------------------------------------------------
   10. УТИЛІТИ
------------------------------------------------------------ */

function setHTML(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
}