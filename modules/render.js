/* ============================================================
   MODULE: render.js — Глобальний UI-рендер (PRO MODE)
   Стежить за оновленням всіх секцій додатку
   Викликається після:
   - autosave()
   - зміни DATA
   - відновлення з Drive
   - initApp()
============================================================ */

import { DATA } from "../core/data.js";

/* ------------------------------------------------------------
   УТИЛІТА
------------------------------------------------------------ */
function set(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
}

/* ------------------------------------------------------------
   1. FEED (комбікорм)
------------------------------------------------------------ */
export function renderFeed() {
    const f = DATA.feed || {};

    // Рецепт (таблиця компонентів)
    if (f.components) {
        let html = "";
        for (let key in f.components) {
            html += `
                <tr>
                    <td>${key}</td>
                    <td>${f.components[key].kg.toFixed(2)} кг</td>
                    <td><input data-comp="${key}" class="feed-price" type="number" value="${f.components[key].price || 0}"></td>
                    <td>${(f.components[key].kg * (f.components[key].price || 0)).toFixed(2)}</td>
                </tr>
            `;
        }
        set("feedRows", html);
    }

    // Загальна вага & вартість
    set("feedTotalKg", f.totalKg?.toFixed(2) || "0");
    set("feedTotalCost", f.totalCost?.toFixed(2) || "0");

    // Добова норма
    set("dailyNeedKg", f.dailyNeedKg?.toFixed(2) || "0");
    set("dailyCost", f.dailyCost?.toFixed(2) || "0");

    // Залишки
    set("readyFeed", f.ready?.toFixed(2) || "0");
    set("feedLeft", f.ready?.toFixed(2) || "0");
    set("daysLeft", f.daysLeft || "0");

    // Таблиця запасів
    if (f.stockTable) {
        let html = "";
        for (let row of f.stockTable) {
            html += `
                <tr class="${row.statusClass}">
                    <td>${row.name}</td>
                    <td>${row.have}</td>
                    <td>${row.need}</td>
                    <td>${row.status}</td>
                </tr>`;
        }
        set("componentStockTable", html);
    }

    // Мені треба купити
    set("buySummary", f.buyListHtml || "<li>Все є ✔</li>");
}

/* ------------------------------------------------------------
   2. EGGS (яйця)
------------------------------------------------------------ */
export function renderEggs() {
    const e = DATA.eggs || {};

    set("eggsForSale", e.todayForSale || 0);
    set("eggsForSaleTotal", e.totalForSale || 0);
    set("traysCount", e.trays || 0);
    set("eggsRemainder", e.remainder || 0);
    set("income", (e.income || 0).toFixed(2));

    // Продуктивність
    set("hensTotal", e.hensTotal || 0);
    set("productivityToday", (e.productivity || 0).toFixed(1));

    // Підсумок по лотках
    set("totalTraysTodayLabel", e.trays || 0);
    set("reservedTrays", e.reservedTrays || 0);
    set("freeTrays", e.freeTrays || 0);
}

/* ------------------------------------------------------------
   3. ORDERS (замовлення)
------------------------------------------------------------ */
export function renderOrders() {
    const active = DATA.orders.filter(o => !o.done);
    const done = DATA.orders.filter(o => o.done);

    let aHTML = "";
    let dHTML = "";

    for (let o of active) {
        aHTML += `
        <tr>
            <td>${o.name}</td>
            <td>${o.trays} лот.</td>
            <td>${o.date}</td>
            <td>${o.note || ""}</td>
            <td><button onclick="completeOrder(${o.id})">✔</button></td>
        </tr>`;
    }

    for (let o of done) {
        dHTML += `
        <tr>
            <td>${o.name}</td>
            <td>${o.trays} лот.</td>
            <td>${o.date}</td>
            <td>${o.note || ""}</td>
            <td>✓</td>
        </tr>`;
    }

    set("ordersActive", aHTML);
    set("ordersDone", dHTML);
}

/* ------------------------------------------------------------
   4. CLIENTS (клієнти)
------------------------------------------------------------ */
export function renderClients() {
    const list = Object.values(DATA.clients || {});
    let html = "";

    for (let c of list) {
        html += `
        <tr>
            <td>${c.name}</td>
            <td>${c.orders}</td>
            <td>${c.trays}</td>
            <td>${c.eggs}</td>
            <td>${c.income.toFixed(2)}</td>
            <td>${c.lastDate}</td>
        </tr>`;
    }

    set("clientsBody", html);
}

/* ------------------------------------------------------------
   5. FINANCE (фінанси)
------------------------------------------------------------ */
export function renderFinance() {
    const f = DATA.finance || {};

    set("summaryFeedCost", f.dailyFeedCost?.toFixed(2) || "0");
    set("summaryEggIncome", f.dailyIncome?.toFixed(2) || "0");
    set("summaryProfit", f.dailyProfit?.toFixed(2) || "0");

    set("repDays", f.repDays || 0);
    set("repEggs", f.repEggs || 0);
    set("repTrays", f.repTrays || 0);
    set("repIncome", f.repIncome?.toFixed(2) || "0");
    set("repFeedCost", f.repFeedCost?.toFixed(2) || "0");
    set("repProfit", f.repProfit?.toFixed(2) || "0");
}

/* ------------------------------------------------------------
   6. INCUBATION (інкубація)
------------------------------------------------------------ */
export function renderInc() {
    const list = DATA.incub || [];
    let html = "";

    for (let i of list) {
        html += `
        <tr>
            <td>${i.name}</td>
            <td>${i.start}</td>
            <td>${i.days}</td>
            <td>${i.eggs}</td>
            <td>${i.infertile}</td>
            <td>${i.hatched}</td>
            <td>${i.diedInc}</td>
            <td>${i.diedBrooder}</td>
            <td>${i.alive}</td>
            <td>${i.note || ""}</td>
            <td><button onclick="deleteInc(${i.id})">🗑</button></td>
        </tr>`;
    }

    set("incubationBody", html);
}

/* ------------------------------------------------------------
   7. FLOCK (поголів’я)
------------------------------------------------------------ */
export function renderFlock() {
    const f = DATA.flock || {};
    const total = (f.males || 0) + (f.females || 0) - (f.deaths || 0);
    set("flockTotal", total);
}

/* ------------------------------------------------------------
   8. LOGS (витрати)
------------------------------------------------------------ */
export function renderLogs() {
    let html = "";
    for (let l of DATA.logs || []) {
        html += `
        <tr>
            <td>${l.date}</td>
            <td>${l.category}</td>
            <td>${l.amount} грн</td>
            <td>${l.comment || ""}</td>
            <td><button onclick="deleteLog(${l.id})">🗑</button></td>
        </tr>`;
    }
    set("logBody", html);
}

/* ------------------------------------------------------------
   9. Глобальний рендер
------------------------------------------------------------ */
export function renderAll() {
    renderFeed();
    renderEggs();
    renderOrders();
    renderClients();
    renderFinance();
    renderInc();
    renderFlock();
    renderLogs();
}