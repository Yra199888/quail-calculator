/* =========================
   ТЕМА
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
   КАЛЬКУЛЯТОР КОМПОНЕНТІВ
========================= */

const feedComponents = [
    ["Кукурудза", 10],
    ["Пшениця", 5],
    ["Ячмінь", 1.5],
    ["Соєва макуха", 3],
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
        readyTrays: 0,     // повні вільні лотки
        reservedTrays: 0   // заброньовані
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
    const trays20 = Math.floor(commercial / 20);

    // авто-списання лотків
    warehouse.readyTrays += trays20;

    if (warehouse.trays["Лотки 20 шт"] < trays20) {
        alert("Недостатньо лотків на складі!");
    } else {
        warehouse.trays["Лотки 20 шт"] -= trays20;
    }

    eggs[date] = { good, bad, home, commercial, trays: trays20 };
    localStorage.setItem("eggs", JSON.stringify(eggs));
    saveWarehouse();
}

/* =========================
   ЗАМОВЛЕННЯ + АВТОРЕЗЕРВ
========================= */

let orders = JSON.parse(localStorage.getItem("orders") || "{}");

function addOrder() {
    const date = orderDate.value || new Date().toISOString().slice(0, 10);
    const name = orderName.value;
    const trays = Number(orderTrays.value);
    const details = orderDetails.value;

    if (!orders[date]) orders[date] = [];

    // авто-резерв
    if (warehouse.readyTrays >= trays) {
        warehouse.readyTrays -= trays;
        warehouse.reservedTrays += trays;
    } else {
        alert("❗ Недостатньо повних лотків для резерву!");
        return;
    }

    orders[date].push({
        name,
        trays,
        details,
        status: "active"
    });

    localStorage.setItem("orders", JSON.stringify(orders));
    saveWarehouse();
    showOrders();
}

function showOrders() {
    let out = `
    <p>Вільні лотки: <b>${warehouse.readyTrays}</b></p>
    <p>Заброньовані: <b>${warehouse.reservedTrays}</b></p>
    `;

    Object.keys(orders)
        .sort()
        .reverse()
        .forEach(date => {
            out += `<h3>${date}</h3>`;
            orders[date].forEach((o, i) => {
                out += `
                <div class="container">
                    <b>${o.name}</b> — ${o.trays} лотків<br>
                    ${o.details}<br>
                    Статус: <b>${o.status}</b><br><br>

                    <button onclick="completeOrder('${date}', ${i})">✔️ Виконано</button>
                    <button onclick="cancelOrder('${date}', ${i})">❌ Скасовано</button>
                    <button onclick="deleteOrder('${date}', ${i})">🗑️ Видалити</button>
                </div>
                `;
            });
        });

    document.getElementById("ordersList").innerHTML = out;
}

function completeOrder(date, i) {
    const o = orders[date][i];

    if (o.status !== "active") return;

    warehouse.reservedTrays -= o.trays; // списуємо резерв
    o.status = "completed";

    saveWarehouse();
    localStorage.setItem("orders", JSON.stringify(orders));
    showOrders();
}

function cancelOrder(date, i) {
    const o = orders[date][i];

    if (o.status !== "active") return;

    // повертаємо лотки назад
    warehouse.reservedTrays -= o.trays;
    warehouse.readyTrays += o.trays;

    o.status = "cancelled";

    saveWarehouse();
    localStorage.setItem("orders", JSON.stringify(orders));
    showOrders();
}

function deleteOrder(date, i) {
    const o = orders[date][i];

    if (o.status === "active") {
        // повертаємо резерв
        warehouse.reservedTrays -= o.trays;
        warehouse.readyTrays += o.trays;
    }

    orders[date].splice(i, 1);
    if (orders[date].length === 0) delete orders[date];

    saveWarehouse();
    localStorage.setItem("orders", JSON.stringify(orders));
    showOrders();
}

showOrders();