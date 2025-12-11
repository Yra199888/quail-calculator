/* ========= ТЕМА ========= */
document.querySelector(".theme-switch").onclick = () => {
    document.body.classList.toggle("light");
};

/* ========= НАВІГАЦІЯ ========= */
const pages = document.querySelectorAll(".page");
const navBtns = document.querySelectorAll(".nav-btn");

navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const page = btn.dataset.page;

        if (!page) return;

        navBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        pages.forEach(p => p.classList.remove("active"));
        document.getElementById(page).classList.add("active");
    });
});

/* ========= КАЛЬКУЛЯТОР ========= */
const feed = [
    ["Кукурудза", 10],
    ["Пшениця", 5],
    ["Ячмінь", 1.5],
    ["Соєва макуха", 3],
    ["Соняшникова макуха", 2.5],
    ["Рибне борошно", 1],
    ["Кормові дріжджі", 0.7],
    ["Трикальційфосфат", 0.5],
    ["Dolfos D", 0.7],
    ["Сіль", 0.05],
];

function renderFeed() {
    let html = "<tr><th>Компонент</th><th>К-сть</th><th>Ціна</th><th>Сума</th></tr>";

    feed.forEach((c, i) => {
        let price = localStorage.getItem("p" + i) || 0;
        html += `
        <tr>
            <td>${c[0]}</td>
            <td><input id="qty${i}" value="${c[1]}"></td>
            <td><input id="price${i}" value="${price}"></td>
            <td id="sum${i}">0</td>
        </tr>`;
    });

    document.getElementById("feedTable").innerHTML = html;
    calcFeed();
}
renderFeed();

function calcFeed() {
    let total = 0;
    let kg = 0;

    feed.forEach((c, i) => {
        let q = +document.getElementById("qty" + i).value;
        let p = +document.getElementById("price" + i).value;

        localStorage.setItem("p" + i, p);

        total += q * p;
        kg += q;

        document.getElementById("sum" + i).innerText = (q * p).toFixed(2);
    });

    let per = kg ? total / kg : 0;
    let vol = +document.getElementById("feedVolume").value;

    document.getElementById("feedTotal").innerText = total.toFixed(2);
    document.getElementById("feedPerKg").innerText = per.toFixed(2);
    document.getElementById("feedVolumeTotal").innerText = (per * vol).toFixed(2);
}

document.addEventListener("input", calcFeed);

/* ========= ЯЙЦЯ ========= */
let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");

function saveEggRecord() {
    let d = eggsDate.value || new Date().toISOString().slice(0, 10);

    eggs[d] = {
        good: +eggsGood.value || 0,
        bad: +eggsBad.value || 0,
        home: +eggsHome.value || 0
    };

    localStorage.setItem("eggs", JSON.stringify(eggs));
    renderEggs();
}

function renderEggs() {
    let out = "";

    Object.keys(eggs).sort().reverse().forEach(d => {
        let e = eggs[d];
        let com = e.good - e.bad - e.home;
        let trays = Math.floor(com / 20);

        out += `
        <div class="container">
            <b>${d}</b><br>
            Всього: ${e.good}<br>
            Брак: ${e.bad}<br>
            Дім: ${e.home}<br>
            Комерційні: ${com}<br>
            Лотки: ${trays}
        </div>`;
    });

    eggsList.innerHTML = out;
}
renderEggs();

/* ========= ЗАМОВЛЕННЯ ========= */
let orders = JSON.parse(localStorage.getItem("orders") || "{}");

function addOrder() {
    let d = orderDate.value || new Date().toISOString().slice(0, 10);

    if (!orders[d]) orders[d] = [];

    orders[d].push({
        name: orderName.value,
        trays: +orderTrays.value,
        details: orderDetails.value
    });

    localStorage.setItem("orders", JSON.stringify(orders));
    renderOrders();
}

function renderOrders() {
    let out = "";

    Object.keys(orders).sort().reverse().forEach(d => {
        out += `<h3>${d}</h3>`;

        orders[d].forEach(o => {
            out += `
            <div class="container">
                <b>${o.name}</b> — ${o.trays} лот.<br>
                ${o.details}
            </div>`;
        });
    });

    ordersList.innerHTML = out;
}
renderOrders();

/* ========= ФІНАНСИ ========= */
function saveFinanceSettings() {
    localStorage.setItem("trayPrice", trayPrice.value);
    renderFinance();
}

function renderFinance() {
    let price = +localStorage.getItem("trayPrice") || 50;
    trayPrice.value = price;

    let income = 0;

    Object.values(orders).forEach(arr => {
        arr.forEach(o => income += o.trays * price);
    });

    financeReport.innerHTML = `<b>Дохід:</b> ${income} грн`;
}
renderFinance();

/* ========= CSV ========= */
function exportCSV() {
    let rows = ["Дата,Імʼя,Лотки,Деталі"];

    Object.keys(orders).forEach(d => {
        orders[d].forEach(o => {
            rows.push(`${d},${o.name},${o.trays},${o.details}`);
        });
    });

    let blob = new Blob([rows.join("\n")], { type: "text/csv" });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "orders.csv";
    a.click();
}

/* ========= СКЛАД ========= */
let warehouse = JSON.parse(localStorage.getItem("warehouse") || "{}");

if (Object.keys(warehouse).length === 0) {
    warehouse = {
        grain: { name: "Зерно", unit: "кг", items: {} },
        cake: { name: "Макуха / шроти", unit: "кг", items: {} },
        minerals: { name: "Мінерали / добавки", unit: "кг", items: {} },
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

    for (let key in warehouse) {
        let c = warehouse[key];

        html += `
        <div class="container w-cat">
            <h3>${c.name} (${c.unit})</h3>

            ${Object.keys(c.items).length === 0 ? "<i>Порожньо</i>" : ""}

            ${Object.entries(c.items).map(([name, qty]) =>
                `<div class='w-row'>
                    <div>${name}</div>
                    <div>${qty} ${c.unit}</div>
                </div>`
            ).join("")}

            <div class="w-add">
                <input id="name-${key}" placeholder="Назва">
                <input id="qty-${key}" type="number" placeholder="К-сть">
                <button onclick="addToWarehouse('${key}')">Додати</button>
            </div>
        </div>`;
    }

    warehouseList.innerHTML = html;
}
renderWarehouse();

function addToWarehouse(cat) {
    let name = document.getElementById("name-" + cat).value.trim();
    let qty = +document.getElementById("qty-" + cat).value;

    if (!name || qty <= 0) return alert("Помилка вводу!");

    if (!warehouse[cat].items[name]) warehouse[cat].items[name] = 0;
    warehouse[cat].items[name] += qty;

    saveWarehouse();
    renderWarehouse();
}