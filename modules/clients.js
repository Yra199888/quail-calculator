/* ============================================================
   MODULE: clients.js — Клієнти та їх статистика
   Працює з GLOBAL DATA.orders
   Викликається renderClients()
============================================================ */

/* ------------------------------------------------------------
   1. Автоматичне генерування клієнтів зі списку замовлень
------------------------------------------------------------ */

function buildClientsStats() {

    // очищаємо попередні дані
    DATA.clients = {};

    for (let o of DATA.orders) {

        // Завершені або активні — для статистики беремо ВСІ
        const name = o.name?.trim() || "Без імені";

        if (!DATA.clients[name]) {
            DATA.clients[name] = {
                orders: 0,
                trays: 0,
                eggs: 0,
                amount: 0,
                lastDate: "-"
            };
        }

        const c = DATA.clients[name];

        c.orders += 1;
        c.trays += Number(o.trays || 0);
        c.eggs  += Number(o.eggs || 0);

        // Ціна лотка — глобальна (взята з DATA.eggs або DOM)
        const trayPrice = Number(DATA.eggs?.trayPrice || document.getElementById("trayPrice")?.value || 0);
        c.amount += Number(o.trays || 0) * trayPrice;

        // дата
        if (o.date) {
            if (c.lastDate === "-" || o.date > c.lastDate) {
                c.lastDate = o.date;
            }
        }
    }
}

/* ------------------------------------------------------------
   2. Рендер таблиці клієнтів
------------------------------------------------------------ */

function renderClients() {

    buildClientsStats();

    const tbody = document.getElementById("clientsBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const entries = Object.entries(DATA.clients);

    if (entries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="opacity:0.6;">Немає даних</td></tr>`;
        return;
    }

    for (let [name, c] of entries) {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${name}</td>
            <td>${c.orders}</td>
            <td>${c.trays}</td>
            <td>${c.eggs}</td>
            <td>${c.amount.toFixed(2)}</td>
            <td>${c.lastDate}</td>
        `;

        tbody.appendChild(tr);
    }
}

/* ------------------------------------------------------------
   3. Автоматичне оновлення при зміні замовлень
------------------------------------------------------------ */

function clientsOnOrdersUpdated() {
    renderClients();
    autosave();
}

/* ------------------------------------------------------------
   4. Експорт у GLOBAL API
------------------------------------------------------------ */

window.renderClients = renderClients;
window.clientsOnOrdersUpdated = clientsOnOrdersUpdated;