// ============================
//      ТЕМА (ніч / день)
// ============================
const themeSwitch = document.getElementById("themeSwitch");
if (themeSwitch) {
    themeSwitch.addEventListener("click", () => {
        document.body.classList.toggle("light");
        themeSwitch.textContent =
            document.body.classList.contains("light") ? "☀️" : "🌙";
    });
}

// ============================
//      НАВІГАЦІЯ
// ============================
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const page = btn.dataset.page;
        if (!page) return;

        document.querySelectorAll(".page")
            .forEach(p => p.classList.remove("active-page"));

        const target = document.getElementById("page-" + page);
        if (target) target.classList.add("active-page");

        document.querySelectorAll(".nav-btn")
            .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");
    });
});

// ============================
//      КОМПОНЕНТИ КОРМУ
// ============================
const feedComponents = [
    ["Кукурудза", 10],
    ["Пшениця", 5],
    ["Ячмінь", 1.5],
    ["Соева макуха", 3],
    ["Соняшникова макуха", 2.5],
    ["Рибне борошно", 1],
    ["Дріжджі", 0.7],
    ["Трикальційфосфат", 0.5],
    ["Dolfos D", 0.7],
    ["Сіль", 0.05]
];

// ============================
//      КАЛЬКУЛЯТОР КОРМУ
// ============================
function loadFeedTable() {
    const tbody = document.getElementById("feedTable");
    if (!tbody) return;

    let html = "";
    feedComponents.forEach((item, i) => {
        const price = localStorage.getItem("price_" + i) || 0;
        const qty = localStorage.getItem("qty_" + i) ?? item[1];

        html += `
        <tr>
            <td>${item[0]}</td>
            <td><input class="qty" data-i="${i}" type="number" value="${qty}"></td>
            <td><input class="price" data-i="${i}" type="number" value="${price}"></td>
            <td id="sum_${i}">0</td>
        </tr>`;
    });

    tbody.innerHTML = html;
    calculateFeed();

    document.querySelectorAll(".qty, .price, #feedVolume")
        .forEach(el => el.addEventListener("input", calculateFeed));
}

function calculateFeed() {
    let total = 0;
    let totalKg = 0;

    feedComponents.forEach((item, i) => {
        const qty = Number(document.querySelector(`.qty[data-i="${i}"]`)?.value) || 0;
        const price = Number(document.querySelector(`.price[data-i="${i}"]`)?.value) || 0;

        localStorage.setItem("qty_" + i, qty);
        localStorage.setItem("price_" + i, price);

        const sum = qty * price;
        total += sum;
        totalKg += qty;

        const sumCell = document.getElementById("sum_" + i);
        if (sumCell) sumCell.textContent = sum.toFixed(2);
    });

    const perKg = totalKg ? total / totalKg : 0;
    const volume = Number(document.getElementById("feedVolume")?.value) || 0;

    document.getElementById("feedTotal").textContent = total.toFixed(2);
    document.getElementById("feedPerKg").textContent = perKg.toFixed(2);
    document.getElementById("feedVolumeTotal").textContent = (perKg * volume).toFixed(2);
}

loadFeedTable();

// ============================
//      СКЛАД
// ============================
let warehouse = JSON.parse(localStorage.getItem("warehouse") || "{}");
if (!warehouse.feed) {
    warehouse = {
        feed: {},
        trays: 0,
        ready: 0,
        reserved: 0,
        eggsRemainder: 0,   // 🔥 ЗАЛИШОК ЯЄЦЬ
        history: []
    };
    saveWarehouse();
}

function saveWarehouse() {
    localStorage.setItem("warehouse", JSON.stringify(warehouse));
}

function renderWarehouse() {
    const tbody = document.getElementById("warehouseTable");
    if (!tbody) return;

    let html = "";
    feedComponents.forEach(item => {
        const name = item[0];
        const need = item[1];
        const stock = warehouse.feed[name] || 0;

        html += `
        <tr>
            <td>${name}</td>
            <td><input class="addStock" data-name="${name}" type="number" value="0"></td>
            <td>${need}</td>
            <td>${stock.toFixed(2)}</td>
        </tr>`;
    });

    tbody.innerHTML = html;

    document.querySelectorAll(".addStock").forEach(inp => {
        inp.addEventListener("change", e => {
            const name = e.target.dataset.name;
            const val = Number(e.target.value) || 0;
            if (val > 0) {
                warehouse.feed[name] = (warehouse.feed[name] || 0) + val;
                saveWarehouse();
                renderWarehouse();
            }
        });
    });

    document.getElementById("trayStock").value = warehouse.trays;
    document.getElementById("fullTrays").textContent = warehouse.ready;
    document.getElementById("reservedTrays").textContent = warehouse.reserved;
}

renderWarehouse();

/* =========================
      ЯЙЦЯ — НАКОПИЧЕННЯ + РЕДАГУВАННЯ
========================= */

let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");

// ініціалізація залишку
if (warehouse.eggsRemainder === undefined) {
    warehouse.eggsRemainder = 0;
    saveWarehouse();
}

function saveEggRecord(editDate = null) {
    const date = editDate || eggsDate.value || new Date().toISOString().slice(0, 10);
    const good = Number(eggsGood.value) || 0;
    const bad  = Number(eggsBad.value) || 0;
    const home = Number(eggsHome.value) || 0;

    const commercial = Math.max(good - bad - home, 0);

    // ⛔ якщо редагуємо день — спочатку відкочуємо старі дані
    if (eggs[date]) {
        warehouse.eggsRemainder -= eggs[date].commercial;
        if (warehouse.eggsRemainder < 0) warehouse.eggsRemainder = 0;
    }

    // ➕ додаємо нові яйця
    warehouse.eggsRemainder += commercial;

    // 🧮 рахуємо лотки з накопичення
    const newTrays = Math.floor(warehouse.eggsRemainder / 20);
    warehouse.eggsRemainder = warehouse.eggsRemainder % 20;

    warehouse.ready += newTrays;

    eggs[date] = {
        good,
        bad,
        home,
        commercial,
        trays: newTrays
    };

    localStorage.setItem("eggs", JSON.stringify(eggs));
    saveWarehouse();

    renderEggInfo();
    renderEggsReport();
    renderWarehouse();
}

function renderEggInfo() {
    const info = document.getElementById("eggsInfo");
    if (!info) return;

    info.innerHTML = `
        🥚 Залишок яєць: <b>${warehouse.eggsRemainder}</b><br>
        📦 Повних лотків на складі: <b>${warehouse.ready}</b>
    `;
}

function renderEggsReport() {
    const list = document.getElementById("eggsList");
    if (!list) return;

    list.innerHTML = "";

    Object.keys(eggs).sort().reverse().forEach(d => {
        const e = eggs[d];
        list.innerHTML += `
        <div class="egg-entry">
            <b>${d}</b><br>
            Всього: ${e.good} | Брак: ${e.bad} | Для дому: ${e.home}<br>
            Комерційні: ${e.commercial}<br>
            Нових лотків: ${e.trays}<br>
            <button onclick="editEgg('${d}')">✏️ Редагувати</button>
        </div>`;
    });
}

function editEgg(date) {
    const e = eggs[date];
    if (!e) return;

    eggsDate.value = date;
    eggsGood.value = e.good;
    eggsBad.value  = e.bad;
    eggsHome.value = e.home;

    document.querySelector(".egg-save").onclick = () => saveEggRecord(date);
}

renderEggInfo();
renderEggsReport();

// ============================
//      ЗАМОВЛЕННЯ
// ============================
let orders = JSON.parse(localStorage.getItem("orders") || "{}");

function addOrder() {
    const d = orderDate.value || new Date().toISOString().slice(0, 10);
    const trays = Number(orderTrays.value) || 0;

    if (!orders[d]) orders[d] = [];
    orders[d].push({
        name: orderName.value || "Без імені",
        trays,
        details: orderDetails.value || "",
        status: "активне"
    });

    warehouse.reserved += trays;
    saveWarehouse();
    localStorage.setItem("orders", JSON.stringify(orders));

    showOrders();
    renderWarehouse();
}

function setStatus(d, i, s) {
    const o = orders[d][i];
    if (!o) return;

    if (o.status === "активне") {
        if (s === "виконано") {
            warehouse.reserved -= o.trays;
            warehouse.ready = Math.max(warehouse.ready - o.trays, 0);
        }
        if (s === "скасовано") {
            warehouse.reserved -= o.trays;
        }
    }

    o.status = s;
    saveWarehouse();
    localStorage.setItem("orders", JSON.stringify(orders));
    showOrders();
    renderWarehouse();
}

function showOrders() {
    const box = document.getElementById("ordersList");
    if (!box) return;

    const free = Math.max(warehouse.ready - warehouse.reserved, 0);

    let html = `
        <div><b>Вільні лотки:</b> ${free} |
        <b>Замовлено:</b> ${warehouse.reserved}</div>`;

    Object.keys(orders).sort().reverse().forEach(d => {
        html += `<h3>${d}</h3>`;
        orders[d].forEach((o, i) => {
            html += `
            <div>
                <b>${o.name}</b> — ${o.trays} лотків (${o.status})<br>
                ${o.details}<br>
                <button onclick="setStatus('${d}',${i},'виконано')">✅</button>
                <button onclick="setStatus('${d}',${i},'скасовано')">❌</button>
            </div>`;
        });
    });

    box.innerHTML = html;
}

showOrders();