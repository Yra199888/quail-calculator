// ============================
//      ТЕМА (ніч / день)
// ============================
const themeSwitch = document.getElementById("themeSwitch");
if (themeSwitch) {
    themeSwitch.addEventListener("click", () => {
        document.body.classList.toggle("light");
        themeSwitch.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
    });
}

// ============================
//      НАВІГАЦІЯ по вкладках
// ============================
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const page = btn.dataset.page;
        if (!page) return; // для кнопки теми

        document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
        const target = document.getElementById("page-" + page);
        if (target) target.classList.add("active-page");

        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

// ============================
//      СПІЛЬНІ ДАНІ КОМПОНЕНТІВ
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
        const savedPrice = localStorage.getItem("price_" + i) || 0;
        const savedQty   = localStorage.getItem("qty_" + i) ?? item[1];

        html += `
        <tr>
            <td>${item[0]}</td>
            <td><input data-i="${i}" class="qty" type="number" value="${savedQty}"></td>
            <td><input data-i="${i}" class="price" type="number" value="${savedPrice}"></td>
            <td id="sum_${i}">0.00</td>
        </tr>`;
    });

    tbody.innerHTML = html;
    calculateFeed();

    document.querySelectorAll(".qty, .price, #feedVolume").forEach(inp => {
        inp.addEventListener("input", calculateFeed);
    });
}

function calculateFeed() {
    let total = 0;
    let totalKg = 0;

    feedComponents.forEach((item, i) => {
        const qtyEl = document.querySelector(`.qty[data-i="${i}"]`);
        const priceEl = document.querySelector(`.price[data-i="${i}"]`);
        if (!qtyEl || !priceEl) return;

        const qty = Number(qtyEl.value) || 0;
        const price = Number(priceEl.value) || 0;

        localStorage.setItem("qty_" + i, qty);
        localStorage.setItem("price_" + i, price);

        const sum = qty * price;
        total += sum;
        totalKg += qty;

        const sumCell = document.getElementById("sum_" + i);
        if (sumCell) sumCell.textContent = sum.toFixed(2);
    });

    const perKg = totalKg > 0 ? total / totalKg : 0;
    const volInput = document.getElementById("feedVolume");
    const volume = volInput ? Number(volInput.value) || 0 : 0;

    const totalEl = document.getElementById("feedTotal");
    const perKgEl = document.getElementById("feedPerKg");
    const volTotalEl = document.getElementById("feedVolumeTotal");

    if (totalEl) totalEl.textContent = total.toFixed(2);
    if (perKgEl) perKgEl.textContent = perKg.toFixed(2);
    if (volTotalEl) volTotalEl.textContent = (perKg * volume).toFixed(2);
}

loadFeedTable();

// ============================
//      СКЛАД
// ============================
let warehouse = JSON.parse(localStorage.getItem("warehouse") || "{}");
if (!warehouse.feed) {
    warehouse = {
        feed: {},      // { "Кукурудза": 100, ... }
        trays: 0,      // пусті лотки
        ready: 0,      // готові повні лотки
        reserved: 0,   // заброньовані лотки
        history: []    // історія замісів
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
        const perMix = item[1];
        const stock = warehouse.feed[name] || 0;

        html += `
        <tr>
            <td>${name}</td>
            <td><input type="number" class="addStock" data-name="${name}" value="0"></td>
            <td>${perMix}</td>
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

    const trayStock = document.getElementById("trayStock");
    if (trayStock) {
        trayStock.value = warehouse.trays;
        trayStock.addEventListener("change", e => {
            warehouse.trays = Number(e.target.value) || 0;
            saveWarehouse();
        });
    }

    const fullTrays = document.getElementById("fullTrays");
    const reservedTrays = document.getElementById("reservedTrays");
    if (fullTrays) fullTrays.textContent = warehouse.ready;
    if (reservedTrays) reservedTrays.textContent = warehouse.reserved;

    const mixHistory = document.getElementById("mixHistory");
    if (mixHistory) {
        if (warehouse.history.length === 0) {
            mixHistory.innerHTML = "<i>Порожньо</i>";
        } else {
            mixHistory.innerHTML = "<ul>" +
                warehouse.history.map(x => `<li>${x}</li>`).join("") +
                "</ul>";
        }
    }
}

const makeFeedBtn = document.getElementById("makeFeedBtn");
if (makeFeedBtn) {
    makeFeedBtn.addEventListener("click", () => {
        // перевірка наявності компонентів
        for (let item of feedComponents) {
            const name = item[0];
            const need = item[1];
            if ((warehouse.feed[name] || 0) < need) {
                alert(`Недостатньо компоненту: ${name}`);
                return;
            }
        }
        // списання
        feedComponents.forEach(item => {
            const name = item[0];
            const need = item[1];
            warehouse.feed[name] -= need;
        });

        warehouse.history.push("Заміс: " + new Date().toLocaleString());
        saveWarehouse();
        renderWarehouse();
    });
}

renderWarehouse();

// ============================
//      ЯЙЦЯ
// ============================
let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");

function saveEggRecord(){
    const d = eggsDate.value || new Date().toISOString().slice(0,10);
    const good = +eggsGood.value || 0;
    const bad = +eggsBad.value || 0;
    const home = +eggsHome.value || 0;

    const commercial = good - bad - home;
    const trays = Math.floor(commercial / 20);
    const left = commercial % 20;

    eggs[d] = { good, bad, home, commercial, trays, left };
    localStorage.setItem("eggs", JSON.stringify(eggs));

    // 🔥 АВТОМАТИЧНЕ ДОДАВАННЯ ПОВНИХ ЛОТКІВ
    warehouse.ready = (warehouse.ready || 0) + trays;
    saveWarehouse();

    // Інформація під кнопкою "Зберегти"
    const info = document.getElementById("eggsInfo");
    if (info) {
        if (commercial < 20) {
            info.innerHTML = `Зібрано ${commercial} яєць — до повного лотка не вистачає ${20 - commercial}`;
        } else {
            info.innerHTML = `Повних лотків: ${trays}, залишок: ${left} яєць`;
        }
    }

    showEggs();
    renderWarehouse(); // оновлюємо склад
}

function showEggs() {
    const box = document.getElementById("eggsList");
    if (!box) return;

    let out = "";
    Object.keys(eggs).sort().reverse().forEach(d => {
        const e = eggs[d];
        out += `
        <div class="egg-entry">
            <b>${d}</b><br>
            Всього: ${e.good}, брак: ${e.bad}, дім: ${e.home}<br>
            Комерційні: ${e.com}, лотків: ${e.trays}, залишок: ${e.left}
        </div>`;
    });
    box.innerHTML = out;
}

showEggs();

// ============================
//      ЗАМОВЛЕННЯ
// ============================
let orders = JSON.parse(localStorage.getItem("orders") || "{}");

function addOrder() {
    const d = (document.getElementById("orderDate").value) || new Date().toISOString().slice(0, 10);
    const name = document.getElementById("orderName").value || "Без імені";
    const trays = Number(document.getElementById("orderTrays").value) || 0;
    const details = document.getElementById("orderDetails").value || "";

    if (!orders[d]) orders[d] = [];
    orders[d].push({
        name,
        trays,
        details,
        status: "активне"
    });

    warehouse.reserved += trays;
    saveWarehouse();
    localStorage.setItem("orders", JSON.stringify(orders));
    showOrders();
    renderWarehouse();
}

function setStatus(date, index, newStatus) {
    const o = orders[date][index];
    if (!o) return;

    const oldStatus = o.status;
    if (oldStatus === newStatus) return;

    // корекція резерву/готових
    if (oldStatus === "активне") {
        if (newStatus === "виконано") {
            // віддаємо лотки
            warehouse.reserved -= o.trays;
            warehouse.ready = Math.max(0, warehouse.ready - o.trays);
        } else if (newStatus === "скасовано") {
            warehouse.reserved -= o.trays;
        }
    }

    o.status = newStatus;
    saveWarehouse();
    localStorage.setItem("orders", JSON.stringify(orders));
    showOrders();
    renderWarehouse();
}

function showOrders() {
    const box = document.getElementById("ordersList");
    if (!box) return;

    const freeTrays = Math.max(warehouse.ready - warehouse.reserved, 0);

    let html = `
        <div class="orders-summary">
            Вільних лотків: <b>${freeTrays}</b> |
            Замовлено: <b>${warehouse.reserved}</b> |
            Готових на складі: <b>${warehouse.ready}</b>
        </div>
    `;

    Object.keys(orders).sort().reverse().forEach(d => {
        html += `<h3>${d}</h3>`;
        orders[d].forEach((o, i) => {
            let statusClass = "status-active";
            if (o.status === "виконано") statusClass = "status-done";
            if (o.status === "скасовано") statusClass = "status-cancel";

            html += `
            <div>
                <b>${o.name}</b> — ${o.trays} лотків
                <span class="${statusClass}">(${o.status})</span><br>
                ${o.details ? "Деталі: " + o.details + "<br>" : ""}
                <button onclick="setStatus('${d}', ${i}, 'виконано')">✅ Виконано</button>
                <button onclick="setStatus('${d}', ${i}, 'скасовано')">❌ Скасовано</button>
            </div>`;
        });
    });

    box.innerHTML = html;
}

showOrders();