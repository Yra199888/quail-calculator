// app.js
// Без import/export, все через глобальний DATA і функції в window

// ---------- ЛОКАЛЬНЕ ЗБЕРЕЖЕННЯ ----------

const STORAGE_KEY = "quail_pro_simple_v1";

function saveLocal() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA));
        console.log("💾 Збережено локально");
    } catch (e) {
        console.error("Помилка saveLocal", e);
    }
}

function loadLocal() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const obj = JSON.parse(raw);
        Object.assign(DATA, obj);
        console.log("✅ Дані завантажено з localStorage");
    } catch (e) {
        console.error("Помилка loadLocal", e);
    }
}

let autosaveTimer = null;
function autosave() {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(saveLocal, 300);
}

// ---------- НАВІГАЦІЯ ВКЛАДОК ----------

window.showPage = function (id, el) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    const target = document.getElementById(id);
    if (target) target.classList.add("active");

    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    if (el) el.classList.add("active");
};

// ---------- FEED (КОРМ) ----------

function renderFeed() {
    const body = document.getElementById("feedRecipeBody");
    if (!body) return;

    const recipe = DATA.feed.recipeKg || {};
    const prices = DATA.feed.prices || {};

    let totalKg = 0;
    let totalCost = 0;
    let html = "";

    for (let name in recipe) {
        const kg = Number(recipe[name] || 0);
        totalKg += kg;

        const price = Number(prices[name] || 0);
        const sum = kg * price;
        totalCost += sum;

        html += `
            <tr>
                <td>${name}</td>
                <td>${kg.toFixed(2)}</td>
                <td>
                    <input type="number" step="0.01"
                        value="${price || ""}"
                        oninput="updateFeedPrice('${name}', this.value)">
                </td>
                <td>${sum.toFixed(2)}</td>
            </tr>
        `;
    }

    DATA.feed.totalKg = totalKg;
    DATA.feed.totalCost = totalCost;
    DATA.feed.costPerKg = totalKg > 0 ? totalCost / totalKg : 0;

    body.innerHTML = html;

    document.getElementById("feedTotalKg").innerText = totalKg.toFixed(2);
    document.getElementById("feedTotalCost").innerText = totalCost.toFixed(2);
    document.getElementById("feedCostPerKg").innerText = DATA.feed.costPerKg.toFixed(2);

    // Оновлюємо фінанси (собівартість 1 кг)
    const finFeed = document.getElementById("finFeedCostPerKg");
    if (finFeed) finFeed.innerText = DATA.feed.costPerKg.toFixed(2);
}

window.updateFeedPrice = function (comp, value) {
    if (!DATA.feed.prices) DATA.feed.prices = {};
    DATA.feed.prices[comp] = Number(value) || 0;
    autosave();
    renderFeed();
    recalcFeedDaily();  // перерахунок добової норми з новою ціною
};

function recalcFeedDaily() {
    const birds = Number(document.getElementById("feedBirds")?.value || 0);
    const perBird = Number(document.getElementById("feedPerBird")?.value || 0); // г/день
    const costPerKg = DATA.feed.costPerKg || 0;

    const dailyKg = birds * perBird / 1000; // у кг
    const dailyCost = dailyKg * costPerKg;

    DATA.finance.feedCostToday = dailyCost;

    const needEl = document.getElementById("feedDailyNeed");
    const costEl = document.getElementById("feedDailyCost");
    if (needEl) needEl.innerText = dailyKg.toFixed(2);
    if (costEl) costEl.innerText = dailyCost.toFixed(2);

    updateFinanceToday();
}

function initFeed() {
    renderFeed();

    const birds = document.getElementById("feedBirds");
    const perBird = document.getElementById("feedPerBird");
    if (birds) birds.addEventListener("input", () => { recalcFeedDaily(); autosave(); });
    if (perBird) perBird.addEventListener("input", () => { recalcFeedDaily(); autosave(); });

    recalcFeedDaily();
}

// ---------- EGGS (ЯЙЦЯ) ----------

function recalcEggsBalance() {
    const total = Number(document.getElementById("eggsTotal")?.value || 0);
    const bad = Number(document.getElementById("eggsBad")?.value || 0);
    const own = Number(document.getElementById("eggsOwn")?.value || 0);
    const carry = Number(document.getElementById("eggsCarry")?.value || 0);
    const trayPrice = Number(document.getElementById("trayPrice")?.value || 0);

    const todayForSale = Math.max(total - bad - own, 0);
    const totalForSale = todayForSale + carry;

    const trays = Math.floor(totalForSale / 20);
    const remainder = totalForSale % 20;

    DATA.eggs.total = total;
    DATA.eggs.bad = bad;
    DATA.eggs.own = own;
    DATA.eggs.carry = carry;
    DATA.eggs.todayForSale = todayForSale;
    DATA.eggs.totalForSale = totalForSale;
    DATA.eggs.trays = trays;
    DATA.eggs.remainder = remainder;
    DATA.eggs.trayPrice = trayPrice;
    DATA.eggs.income = trays * trayPrice;

    // для лотків / замовлень
    const reserved = DATA.eggs.reservedTrays || 0;
    DATA.eggs.freeTrays = Math.max(trays - reserved, 0);

    // Рендер
    setText("eggsForSale", todayForSale);
    setText("eggsForSaleTotal", totalForSale);
    setText("traysCount", trays);
    setText("eggsRemainder", remainder);
    setText("income", DATA.eggs.income.toFixed(2));

    setText("totalTraysTodayLabel", trays);
    setText("reservedTrays", reserved);
    setText("freeTrays", DATA.eggs.freeTrays);

    // Фінанси
    DATA.finance.incomeToday = DATA.eggs.income;
    updateFinanceToday();

    autosave();
}

function recalcProductivity() {
    const hens1 = Number(document.getElementById("hens1")?.value || 0);
    const hens2 = Number(document.getElementById("hens2")?.value || 0);
    const totalEggs = Number(document.getElementById("eggsTotal")?.value || 0);

    const hensTotal = hens1 + hens2;
    const productivity = hensTotal > 0 ? (totalEggs / hensTotal) * 100 : 0;

    DATA.eggs.hens1 = hens1;
    DATA.eggs.hens2 = hens2;
    DATA.eggs.hensTotal = hensTotal;
    DATA.eggs.productivity = productivity;

    setText("hensTotal", hensTotal);
    setText("productivityToday", productivity.toFixed(1));

    autosave();
}

function initEggs() {
    ["eggsTotal", "eggsBad", "eggsOwn", "eggsCarry", "trayPrice"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", recalcEggsBalance);
    });

    ["hens1", "hens2"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", recalcProductivity);
    });

    recalcEggsBalance();
    recalcProductivity();
}

// ---------- ORDERS (ЗАМОВЛЕННЯ) ----------

window.addOrder = function () {
    const name = document.getElementById("ordName").value.trim();
    const eggs = Number(document.getElementById("ordEggs").value || 0);
    const trays = Number(document.getElementById("ordTrays").value || 0);
    let date = document.getElementById("ordDate").value;
    const note = document.getElementById("ordNote").value.trim();

    if (!name || trays <= 0) {
        alert("Введи ім'я клієнта і кількість лотків > 0");
        return;
    }

    if (!date) {
        date = new Date().toISOString().slice(0, 10);
    }

    const order = {
        id: Date.now(),
        name,
        eggs: eggs || trays * 20,
        trays,
        date,
        note,
        done: false
    };

    DATA.orders.push(order);
    recalcReservedTrays();
    renderOrders();
    renderClients();
    autosave();

    document.getElementById("ordName").value = "";
    document.getElementById("ordEggs").value = "";
    document.getElementById("ordTrays").value = "";
    document.getElementById("ordDate").value = "";
    document.getElementById("ordNote").value = "";
};

window.completeOrder = function (id) {
    const o = DATA.orders.find(o => o.id === id);
    if (!o) return;
    o.done = true;
    recalcReservedTrays();
    renderOrders();
    renderClients();
    autosave();
};

function recalcReservedTrays() {
    let reserved = 0;
    for (let o of DATA.orders) {
        if (!o.done) reserved += Number(o.trays || 0);
    }
    DATA.eggs.reservedTrays = reserved;

    const totalTrays = DATA.eggs.trays || 0;
    DATA.eggs.freeTrays = Math.max(totalTrays - reserved, 0);

    setText("reservedTrays", reserved);
    setText("freeTrays", DATA.eggs.freeTrays);
}

function renderOrders() {
    const activeBody = document.getElementById("ordersActive");
    const doneBody = document.getElementById("ordersDone");
    if (!activeBody || !doneBody) return;

    let htmlA = "";
    let htmlD = "";

    for (let o of DATA.orders) {
        const row = `
            <tr>
                <td>${o.name}</td>
                <td>${o.trays} лот.</td>
                <td>${o.date}</td>
                <td>${o.note || ""}</td>
                <td>
                    ${o.done
                        ? "✔"
                        : `<button onclick="completeOrder(${o.id})">Готово</button>`
                    }
                </td>
            </tr>
        `;

        if (o.done) htmlD += row;
        else htmlA += row;
    }

    activeBody.innerHTML = htmlA || "<tr><td colspan='5'>Немає активних замовлень</td></tr>";
    doneBody.innerHTML = htmlD || "<tr><td colspan='5'>Ще немає виконаних замовлень</td></tr>";
}

// ---------- CLIENTS (КЛІЄНТИ) ----------

function buildClientsSummary() {
    const clients = {};

    for (let o of DATA.orders) {
        if (!o.done) continue;
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
        const c = clients[o.name];
        c.orders += 1;
        c.trays += Number(o.trays || 0);
        c.eggs += Number(o.eggs || 0);
        const price = DATA.eggs.trayPrice || 0;
        c.income += c.trays * price;
        c.lastDate = o.date || c.lastDate;
    }

    DATA.clients = clients;
}

function renderClients() {
    buildClientsSummary();
    const body = document.getElementById("clientsBody");
    if (!body) return;

    const list = Object.values(DATA.clients || {});
    if (!list.length) {
        body.innerHTML = "<tr><td colspan='6'>Ще немає клієнтів</td></tr>";
        return;
    }

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
            </tr>
        `;
    }
    body.innerHTML = html;
}

// ---------- FINANCE (СПРОЩЕНО) ----------

function updateFinanceToday() {
    const income = DATA.finance.incomeToday || 0;
    const feedCost = DATA.finance.feedCostToday || 0;
    const profit = income - feedCost;
    DATA.finance.profitToday = profit;

    setText("finFeedCostPerKg", (DATA.feed.costPerKg || 0).toFixed(2));
    setText("finIncomeToday", income.toFixed(2));
    setText("finProfitToday", profit.toFixed(2));
}

// ---------- INCUBATION (БАЗОВО) ----------

window.addIncubation = function () {
    const name = document.getElementById("incBatchName").value.trim();
    const start = document.getElementById("incStartDate").value;
    const eggs = Number(document.getElementById("incEggsSet").value || 0);
    const note = document.getElementById("incNote").value.trim();

    if (!name || !start || !eggs) {
        alert("Заповни назву, дату і кількість яєць");
        return;
    }

    DATA.incub.push({
        id: Date.now(),
        name,
        start,
        eggs,
        note
    });

    renderIncub();
    autosave();

    document.getElementById("incBatchName").value = "";
    document.getElementById("incStartDate").value = "";
    document.getElementById("incEggsSet").value = "";
    document.getElementById("incNote").value = "";
};

window.deleteInc = function (id) {
    DATA.incub = DATA.incub.filter(i => i.id !== id);
    renderIncub();
    autosave();
};

function renderIncub() {
    const body = document.getElementById("incubationBody");
    if (!body) return;

    if (!DATA.incub.length) {
        body.innerHTML = "<tr><td colspan='6'>Ще немає партій</td></tr>";
        return;
    }

    const today = new Date();

    let html = "";
    for (let i of DATA.incub) {
        const d1 = new Date(i.start);
        const days = Math.floor((today - d1) / 86400000);

        html += `
            <tr>
                <td>${i.name}</td>
                <td>${i.start}</td>
                <td>${isNaN(days) ? "-" : days}</td>
                <td>${i.eggs}</td>
                <td>${i.note || ""}</td>
                <td><button onclick="deleteInc(${i.id})">🗑</button></td>
            </tr>
        `;
    }

    body.innerHTML = html;
}

// ---------- FLOCK (ПОГОЛІВ’Я) ----------

function recalcFlock() {
    const males = Number(document.getElementById("males")?.value || 0);
    const females = Number(document.getElementById("females")?.value || 0);
    const deaths = Number(document.getElementById("deaths")?.value || 0);
    const avgAge = Number(document.getElementById("avgAge")?.value || 0);

    DATA.flock.males = males;
    DATA.flock.females = females;
    DATA.flock.deaths = deaths;
    DATA.flock.avgAge = avgAge;

    const total = Math.max(males + females - deaths, 0);
    setText("flockTotal", total);

    autosave();
}

function initFlock() {
    ["males", "females", "deaths", "avgAge"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", recalcFlock);
    });
    recalcFlock();
}

// ---------- УТИЛІТА ----------

function setText(id, value) {
    const el = document.getElementById(id);
    if (el != null) el.innerText = value;
}

// ---------- INIT ----------

window.addEventListener("DOMContentLoaded", () => {
    // статус мережі — базово
    const sb = document.getElementById("statusBar");
    if (sb) {
        function upd() {
            sb.textContent = "Статус: " + (navigator.onLine ? "online" : "offline (локальне збереження)");
        }
        window.addEventListener("online", upd);
        window.addEventListener("offline", upd);
        upd();
    }

    loadLocal();      // завантажуємо збережені дані (якщо є)
    initFeed();
    initEggs();
    initFlock();
    renderOrders();
    renderClients();
    renderIncub();
    updateFinanceToday();
});