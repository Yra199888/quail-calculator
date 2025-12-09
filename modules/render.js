/* ============================================================
   RENDER.JS — Повний модуль відображення (Варіант 1)

   ФУНКЦІЇ:
   - Оновлюють UI у всіх секціях
   - Викликаються після:
       autosave(), зміни DATA, відновлення з Drive,
       імпорту локальної копії, початкового завантаження
============================================================ */

/* ============================================
   0. УТИЛІТИ
============================================ */

function setHTML(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

/* ============================================
   1. РЕНДЕР КОРМУ
============================================ */

function renderFeed() {
    try {
        const f = DATA.feed || {};

        // 1.1 Готовий комбікорм
        setHTML("readyFeed", f.ready || 0);
        setHTML("feedLeft", f.ready || 0);

        const daily = Number(f.dailyNeed || 0);
        setHTML("daysLeft", daily > 0 ? Math.floor((f.ready || 0) / daily) : 0);

        // 1.2 Таблиця запасів компонентів
        let stockHTML = "";
        if (f.stock) {
            for (let key in f.stock) {
                const have = Number(f.stock[key] || 0);
                const need = Number(f.need?.[key] || 0);
                const buy = Math.max(0, need - have);

                stockHTML += `
                    <tr>
                        <td>${key}</td>
                        <td>${have}</td>
                        <td>${need}</td>
                        <td>${buy}</td>
                    </tr>
                `;
            }
        }
        setHTML("componentStockTable", `
            <tr><th>Компонент</th><th>Є</th><th>Докупити</th></tr>
            ${stockHTML}
        `);

        // 1.3 «Мені треба купити»
        let buyList = "";
        if (f.need && f.stock) {
            for (let key in f.need) {
                const need = Number(f.need[key]);
                const have = Number(f.stock[key] || 0);

                if (need > have) {
                    buyList += `<li>${key}: треба докупити ${need - have} кг</li>`;
                }
            }
        }
        setHTML("buySummary", buyList || "<li>Все є ✔</li>");

    } catch (e) {
        console.error("renderFeed() error:", e);
    }
}

/* ============================================
   2. РЕНДЕР ЯЄЦЬ
============================================ */

function renderEggs() {
    try {
        const e = DATA.eggs || {};

        setHTML("eggsForSale", e.todayForSale || 0);
        setHTML("eggsForSaleTotal", e.totalForSale || 0);
        setHTML("traysCount", e.trays || 0);
        setHTML("eggsRemainder", e.remainder || 0);

        setHTML("income", (e.income || 0).toFixed(2));

        // продуктивність
        setHTML("hensTotal", e.hensTotal || 0);
        setHTML("productivityToday", (e.productivity || 0).toFixed(1));

        // підсумок лотків
        setHTML("totalTraysTodayLabel", e.trays || 0);
        setHTML("reservedTrays", e.reservedTrays || 0);
        setHTML("freeTrays", e.freeTrays || 0);

    } catch (e) {
        console.error("renderEggs() error:", e);
    }
}

/* ============================================
   3. ЗАМОВЛЕННЯ
============================================ */

function renderOrders() {
    try {
        const orders = DATA.orders || [];

        let active = "";
        let done = "";

        for (let o of orders) {
            if (!o.done) {
                active += `
                    <tr>
                        <td>${o.name}</td>
                        <td>${o.trays} лотків</td>
                        <td>${o.date}</td>
                        <td>${o.note || ""}</td>
                        <td><button onclick="completeOrder(${o.id})">✔</button></td>
                    </tr>`;
            } else {
                done += `
                    <tr>
                        <td>${o.name}</td>
                        <td>${o.trays} лотків</td>
                        <td>${o.date}</td>
                        <td>${o.note || ""}</td>
                        <td>✓</td>
                    </tr>`;
            }
        }

        setHTML("ordersActive", active);
        setHTML("ordersDone", done);

    } catch (e) {
        console.error("renderOrders() error:", e);
    }
}

/* ============================================
   4. КЛІЄНТИ
============================================ */

function renderClients() {
    try {
        const c = DATA.clients || {};
        const list = Object.values(c);

        let html = "";
        for (let u of list) {
            html += `
                <tr>
                    <td>${u.name}</td>
                    <td>${u.orders}</td>
                    <td>${u.trays}</td>
                    <td>${u.eggs}</td>
                    <td>${u.income.toFixed(2)} грн</td>
                    <td>${u.lastDate}</td>
                </tr>
            `;
        }
        setHTML("clientsBody", html);

    } catch (e) {
        console.error("renderClients() error:", e);
    }
}

/* ============================================
   5. ФІНАНСИ
============================================ */

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

    } catch (e) {
        console.error("renderFinance() error:", e);
    }
}

/* ============================================
   6. ІНКУБАЦІЯ
============================================ */

function renderInc() {
    try {
        const list = DATA.incub || [];
        let html = "";

        for (let inc of list) {
            const alive =
                inc.eggs -
                (inc.infertile || 0) -
                (inc.diedInc || 0) -
                (inc.diedBrooder || 0);

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
                    <td>${alive}</td>
                    <td>—</td>
                    <td>${inc.note || ""}</td>
                    <td>…</td>
                </tr>`;
        }

        setHTML("incubationBody", html);

    } catch (e) {
        console.error("renderInc() error:", e);
    }
}

/* ============================================
   7. ПОГОЛІВ’Я
============================================ */

function renderFlock() {
    try {
        const f = DATA.flock || {};
        const total = (f.males || 0) + (f.females || 0) - (f.deaths || 0);
        setHTML("flockTotal", total);
    } catch (e) {
        console.error("renderFlock() error:", e);
    }
}

/* ============================================
   8. ЛОГИ
============================================ */

function renderLogs() {
    try {
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
        setHTML("logBody", html);

    } catch (e) {
        console.error("renderLogs() error:", e);
    }
}

/* ============================================
   9. ГЛОБАЛЬНИЙ РЕНДЕР
============================================ */

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