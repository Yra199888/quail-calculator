/* ============================================================
   === ТЕМА (🌙 / ☀️) ==========================================
   ============================================================ */

function toggleTheme() {
    document.body.classList.toggle("light");
    localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
}

(function initTheme() {
    if (localStorage.getItem("theme") === "light") {
        document.body.classList.add("light");
    }
})();

/* ============================================================
   === НАВІГАЦІЙНІ ПАНЕЛІ (верх + низ) =========================
   ============================================================ */

document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const page = btn.dataset.page;

        if (page === "theme") {
            toggleTheme();
            return;
        }

        document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
        document.getElementById("page-" + page).classList.add("active-page");

        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

/* ============================================================
   === КАЛЬКУЛЯТОР ============================================
   ============================================================ */

const feedComponents = [
    ["Кукурудза", 10],
    ["Пшениця", 5],
    ["Ячмінь", 1.5],
    ["Соєва макуха", 3],
    ["Соняшникова макуха", 2.5],
    ["Рибне борошно", 1],
    ["Кормові дріжджі", 0.7],
    ["Трикальційфосфат", 0.5],
    ["Dolfos D", 0.7],
    ["Сіль", 0.05]
];

function loadFeed() {
    let html = "";
    feedComponents.forEach((c, i) => {
        let price = localStorage.getItem("price_" + i) || 0;

        html += `
        <tr>
            <td>${c[0]}</td>
            <td><input id="qty_${i}" value="${c[1]}" type="number"></td>
            <td><input id="price_${i}" value="${price}" type="number"></td>
            <td id="sum_${i}">0</td>
        </tr>`;
    });

    document.getElementById("feedTable").innerHTML = html;
    calcFeed();
}

loadFeed();

function calcFeed() {
    let total = 0, kg = 0;

    feedComponents.forEach((c, i) => {
        let qty = +document.getElementById("qty_" + i).value;
        let price = +document.getElementById("price_" + i).value;

        localStorage.setItem("price_" + i, price);

        let sum = qty * price;

        kg += qty;
        total += sum;

        document.getElementById("sum_" + i).innerText = sum.toFixed(2);
    });

    let perkg = kg ? total / kg : 0;
    let volume = +document.getElementById("feedVolume").value;

    document.getElementById("feedTotal").innerText = total.toFixed(2);
    document.getElementById("feedPerKg").innerText = perkg.toFixed(2);
    document.getElementById("feedVolumeTotal").innerText = (perkg * volume).toFixed(2);
}

document.addEventListener("input", calcFeed);

/* ============================================================
   === ЯЙЦЯ ====================================================
   ============================================================ */

let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");

function saveEggRecord() {
    let date = document.getElementById("eggsDate").value || new Date().toISOString().slice(0, 10);

    eggs[date] = {
        good: +eggsGood.value || 0,
        bad: +eggsBad.value || 0,
        home: +eggsHome.value || 0
    };

    localStorage.setItem("eggs", JSON.stringify(eggs));
    renderEggs();
}

function renderEggs() {
    let html = "";

    Object.keys(eggs).sort().reverse().forEach(date => {
        let e = eggs[date];
        let commercial = e.good - e.bad - e.home;
        let trays = Math.floor(commercial / 20);

        html += `
        <div class="block">
            <b>${date}</b><br>
            Всього: ${e.good}<br>
            Брак: ${e.bad}<br>
            Дім: ${e.home}<br>
            Комерційні: ${commercial}<br>
            Лотків: ${trays}<br>
            <button onclick="deleteEgg('${date}')">Видалити</button>
        </div>`;
    });

    document.getElementById("eggsList").innerHTML = html;
}

renderEggs();

function deleteEgg(date) {
    delete eggs[date];
    localStorage.setItem("eggs", JSON.stringify(eggs));
    renderEggs();
}

/* ============================================================
   === ЗАМОВЛЕННЯ =============================================
   ============================================================ */

let orders = JSON.parse(localStorage.getItem("orders") || "{}");

function addOrder() {
    let date = orderDate.value || new Date().toISOString().slice(0, 10);

    if (!orders[date]) orders[date] = [];

    orders[date].push({
        name: orderName.value,
        trays: +orderTrays.value,
        details: orderDetails.value,
        status: "active"
    });

    localStorage.setItem("orders", JSON.stringify(orders));
    renderOrders();
}

function renderOrders() {
    let html = "";

    Object.keys(orders).sort().reverse().forEach(date => {
        html += `<h3>${date}</h3>`;

        orders[date].forEach((o, i) => {
            html += `
            <div class="block">
                <b>${o.name}</b> — ${o.trays} лотків<br>
                Деталі: ${o.details}<br>
                Статус: <span class="status-${o.status}">${o.status}</span><br>
                <button onclick="setStatus('${date}', ${i}, 'completed')">Виконано</button>
                <button onclick="setStatus('${date}', ${i}, 'cancelled')">Скасовано</button>
                <button onclick="deleteOrder('${date}', ${i})">Видалити</button>
            </div>`;
        });
    });

    document.getElementById("ordersList").innerHTML = html;
}

renderOrders();

function setStatus(date, index, status) {
    orders[date][index].status = status;
    localStorage.setItem("orders", JSON.stringify(orders));
    renderOrders();
}

function deleteOrder(date, index) {
    orders[date].splice(index, 1);
    if (orders[date].length === 0) delete orders[date];
    localStorage.setItem("orders", JSON.stringify(orders));
    renderOrders();
}

/* ============================================================
   === ФІНАНСИ ================================================
   ============================================================ */

function saveFinanceSettings() {
    localStorage.setItem("trayPrice", trayPrice.value);
    renderFinance();
}

function renderFinance() {
    let price = +(localStorage.getItem("trayPrice") || 50);
    trayPrice.value = price;

    let income = 0;

    Object.values(orders).forEach(arr => {
        arr.forEach(o => {
            if (o.status === "completed") {
                income += o.trays * price;
            }
        });
    });

    document.getElementById("financeReport").innerHTML =
        `<b>Дохід:</b> ${income} грн`;
}

renderFinance();

/* ============================================================
   === СКЛАД (комбінований стиль) ==============================
   ============================================================ */

let warehouse = JSON.parse(localStorage.getItem("warehouse") || "{}");

if (Object.keys(warehouse).length === 0) {
    warehouse = {
        grain: { name: "Зерно", unit: "кг", items: {} },
        cake: { name: "Макуха / шроти", unit: "кг", items: {} },
        minerals: { name: "Мінерали", unit: "кг", items: {} },
        packing: { name: "Упаковка", unit: "шт", items: {} },
        ready: { name: "Готова продукція", unit: "шт", items: {} }
    };
    saveWarehouse();
}

function saveWarehouse() {
    localStorage.setItem("warehouse", JSON.stringify(warehouse));
}

function renderWarehouse() {
    let html = "";

    for (let catKey in warehouse) {
        const cat = warehouse[catKey];

        html += `
        <div class="block">
            <h3>${cat.name} (${cat.unit})</h3>

            ${Object.keys(cat.items).length === 0 ? "<i>Порожньо</i>" : ""}

            <div class="w-items">
        `;

        Object.entries(cat.items).forEach(([name, qty]) => {
            html += `
                <div class="w-row">
                    <div>${name}</div>
                    <div>${qty} ${cat.unit}</div>
                </div>`;
        });

        html += `
            </div>
            <div class="w-add">
                <input type="text" id="addName-${catKey}" placeholder="Назва">
                <input type="number" id="addQty-${catKey}" placeholder="К-сть">
                <button onclick="addStock('${catKey}')">Додати</button>
            </div>
        </div>`;
    }

    document.getElementById("warehouseList").innerHTML = html;
}

renderWarehouse();

function addStock(catKey) {
    let name = document.getElementById("addName-" + catKey).value.trim();
    let qty = Number(document.getElementById("addQty-" + catKey).value);

    if (!name || qty <= 0) {
        alert("Введіть назву та кількість");
        return;
    }

    if (!warehouse[catKey].items[name]) warehouse[catKey].items[name] = 0;
    warehouse[catKey].items[name] += qty;

    saveWarehouse();
    renderWarehouse();
}

