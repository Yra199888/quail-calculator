/* =========================
      ПЕРЕМИКАННЯ ТЕМИ
========================= */
const themeSwitch = document.getElementById("themeSwitch");
themeSwitch.addEventListener("click", () => {
    document.body.classList.toggle("light");
    themeSwitch.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
});

/* =========================
      НАВІГАЦІЯ
========================= */
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const page = btn.dataset.page;
        if (!page) return;
        document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
        document.getElementById("page-" + page).classList.add("active-page");

        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

/* =========================
      КАЛЬКУЛЯТОР
========================= */
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

function loadFeedTable() {
    let html = "";
    feedComponents.forEach((item, i) => {
        const savedPrice = localStorage.getItem("price_" + i) || 0;
        html += `
        <tr>
            <td>${item[0]}</td>
            <td><input data-i="${i}" class="qty" type="number" value="${item[1]}"></td>
            <td><input data-i="${i}" class="price" type="number" value="${savedPrice}"></td>
            <td id="sum_${i}">0.00</td>
        </tr>`;
    });
    document.getElementById("feedTable").innerHTML = html;
    calculateFeed();
}

function calculateFeed() {
    let total = 0;
    let totalKg = 0;

    feedComponents.forEach((item, i) => {
        let qty = Number(document.querySelector(`.qty[data-i="${i}"]`).value);
        let price = Number(document.querySelector(`.price[data-i="${i}"]`).value);
        localStorage.setItem("price_" + i, price);

        const sum = qty * price;
        total += sum;
        totalKg += qty;
        document.getElementById("sum_" + i).textContent = sum.toFixed(2);
    });

    const perKg = totalKg > 0 ? total / totalKg : 0;
    const volume = Number(document.getElementById("feedVolume").value);

    document.getElementById("feedTotal").textContent = total.toFixed(2);
    document.getElementById("feedPerKg").textContent = perKg.toFixed(2);
    document.getElementById("feedVolumeTotal").textContent = (perKg * volume).toFixed(2);
}

document.addEventListener("input", calculateFeed);
loadFeedTable();

/* =========================
      СКЛАД
========================= */
let warehouse = JSON.parse(localStorage.getItem("warehouse") || "{}");

if (!warehouse.feed) {
    warehouse = {
        feed: {},
        trays: { "Лотки 20 шт": 0 },
        mixHistory: [],
        readyTrays: 0,
        reservedTrays: 0
    };
    saveWarehouse();
}

function saveWarehouse() {
    localStorage.setItem("warehouse", JSON.stringify(warehouse));
}

/* =========================
      ЯЙЦЯ
========================= */
let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");

function saveEggRecord() {
    const date = eggsDate.value || new Date().toISOString().slice(0, 10);
    const good = Number(eggsGood.value);
    const bad = Number(eggsBad.value);
    const home = Number(eggsHome.value);

    const commercial = good - bad - home;

    let trays20 = Math.floor(commercial / 20);
    let leftover = commercial % 20;

    // авто-списання лотків
    if (warehouse.trays["Лотки 20 шт"] >= trays20) {
        warehouse.trays["Лотки 20 шт"] -= trays20;
        warehouse.readyTrays += trays20;
    }

    eggs[date] = {
        good, bad, home,
        commercial,
        trays: trays20,
        leftover
    };

    localStorage.setItem("eggs", JSON.stringify(eggs));
    saveWarehouse();
    renderEggsList();
    updateOrdersInfo();

    // показуємо інфо під кнопкою
    document.getElementById("eggsInfo").innerHTML = `
        ${leftover > 0 ? `Залишок без лотка: <b>${leftover} яєць</b><br>` : ""}
        Повні лотки сьогодні: <b>${trays20}</b>
    `;
}

function renderEggsList() {
    let out = "";
    Object.keys(eggs).sort().reverse().forEach(date => {
        let e = eggs[date];
        out += `
        <div class="egg-log">
            <b>${date}</b><br>
            Всього: ${e.good}<br>
            Комерційні: ${e.commercial}<br>
            Лотків: ${e.trays}<br>
            Залишок: ${e.leftover}
        </div>`;
    });

    document.getElementById("eggsList").innerHTML = out;
}
renderEggsList();

/* =========================
      ЗАМОВЛЕННЯ
========================= */
let orders = JSON.parse(localStorage.getItem("orders") || "[]");

function addOrder() {
    const name = orderName.value.trim();
    const trays = Number(orderTrays.value);
    const date = orderDate.value || new Date().toISOString().slice(0, 10);
    const details = orderDetails.value;

    if (!name || trays <= 0) {
        alert("Заповни імʼя та кількість лотків!");
        return;
    }

    // Перевірка наявності лотків
    if (warehouse.readyTrays - warehouse.reservedTrays < trays) {
        alert("Недостатньо вільних лотків!");
        return;
    }

    warehouse.reservedTrays += trays;

    orders.push({
        name, trays, date, details,
        status: "active"
    });

    saveWarehouse();
    saveOrders();
    renderOrders();
}

function saveOrders() {
    localStorage.setItem("orders", JSON.stringify(orders));
}

function renderOrders() {
    let out = `
    <p>Вільних лотків: <b>${warehouse.readyTrays - warehouse.reservedTrays}</b></p>
    <p>У замовленнях: <b>${getReservedCount()}</b></p>
    <hr>
    `;

    orders.forEach((o, i) => {
        out += `
        <div class="order-item">
            <b>${o.date}</b><br>
            ${o.name} — ${o.trays} лотків<br>
            ${o.details}<br>
            Статус: <b>${o.status}</b><br>
        </div>
        `;
    });

    document.getElementById("ordersList").innerHTML = out;
}

function getReservedCount() {
    return orders.reduce((sum, o) => sum + (o.status === "active" ? o.trays : 0), 0);
}

function updateOrdersInfo() {
    renderOrders();
}

renderOrders();