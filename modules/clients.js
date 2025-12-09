/* ============================================================
   MODULE: clients.js
   FULL ENTERPRISE MODE
   Відповідає за:
   - автоматичну аналітику клієнтів
   - підрахунок замовлень, лотків, яєць, виручки
   - оновлення таблиці "Клієнти"
   - синхронізацію з глобальним DATA та autosave()
============================================================ */

import { DATA, autosave } from "../core/data.js";
import { renderClients } from "./render.js";

/* ------------------------------------------------------------
   1. Перерахунок статистики клієнтів
------------------------------------------------------------ */

export function updateClientsSummary() {
    const orders = DATA.orders || [];
    const clients = {};

    for (let o of orders) {
        if (!o.done) continue; // враховуємо лише виконані замовлення

        if (!clients[o.name]) {
            clients[o.name] = {
                name: o.name,
                orders: 0,
                trays: 0,
                eggs: 0,
                income: 0,
                lastDate: "-"
            };
        }

        clients[o.name].orders += 1;
        clients[o.name].trays += Number(o.trays || 0);
        clients[o.name].eggs += Number(o.eggs || 0);

        // ціна лотка з DATA.eggs
        const trayPrice = Number(DATA.eggs?.trayPrice || 0);
        clients[o.name].income += Number(o.trays || 0) * trayPrice;

        clients[o.name].lastDate = o.date || clients[o.name].lastDate;
    }

    DATA.clients = clients;

    autosave();
}

/* ------------------------------------------------------------
   2. Рендер таблиці клієнтів
------------------------------------------------------------ */

export function renderClientsTable() {
    updateClientsSummary();

    const tbody = document.getElementById("clientsBody");
    if (!tbody) return;

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

    tbody.innerHTML = html;
}

/* ------------------------------------------------------------
   3. Автоматичне оновлення після змін замовлень
------------------------------------------------------------ */

export function clientsAutoUpdate() {
    updateClientsSummary();
    renderClientsTable();
}

/* Викликається з orders.js після:
   - addOrder()
   - completeOrder()
------------------------------------------------------------ */

/* ------------------------------------------------------------
   4. Ініціалізація модуля
------------------------------------------------------------ */

export function initClientsModule() {
    updateClientsSummary();
    renderClientsTable();
}