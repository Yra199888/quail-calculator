/* ============================================================
   MODULE: clients.js
   Відповідає за:
   - Аналітику клієнтів
   - Зведені дані: замовлення, лотки, яйця, сума
   - Рендер таблиці
   - Автоматичну синхронізацію після змін у orders.js
============================================================ */

/* ------------------------------------------------------------
   1. Оновлення статистики клієнтів
------------------------------------------------------------ */

function updateClientsSummary() {
    const orders = DATA.orders || [];
    const clients = {};

    for (let o of orders) {
        if (!o.done) continue; // рахуємо лише виконані замовлення

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
        clients[o.name].trays += Number(o.trays);
        clients[o.name].eggs += Number(o.eggs);

        // Вартість = кількість лотків × ціна лотка
        const trayPrice = Number(DATA.eggs?.trayPrice || 0);
        clients[o.name].income += Number(o.trays) * trayPrice;

        clients[o.name].lastDate = o.date || clients[o.name].lastDate;
    }

    DATA.clients = clients;
    autosave();
}


/* ------------------------------------------------------------
   2. Рендер таблиці "Клієнти"
------------------------------------------------------------ */

function renderClients() {
    const body = document.getElementById("clientsBody");
    if (!body) return;

    updateClientsSummary();

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
        </tr>`;
    }

    body.innerHTML = html;
}


/* ------------------------------------------------------------
   3. Автоматичний перерахунок після змін замовлень
------------------------------------------------------------ */

function clientsAutoUpdate() {
    updateClientsSummary();
    renderClients();
    autosave();
}

/* Викликатиметься з orders.js після:
   - додавання замовлення
   - підтвердження (done)
   - видалення (якщо додаси)
*/