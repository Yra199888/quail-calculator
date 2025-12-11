/* ========= ТЕМА ========= */
const themeSwitch = document.getElementById("themeSwitch");
themeSwitch.addEventListener("click", () => {
    document.body.classList.toggle("light");
    themeSwitch.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
});

/* ========= НАВІГАЦІЯ ========= */
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

/* ========= КОМПОНЕНТИ КОРМУ ========= */
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

/* ========= СКЛАД ========= */
let warehouse = JSON.parse(localStorage.getItem("warehouse") || "{}");

if (!warehouse.feed) {
    warehouse = {
        feed: {},
        trays: 0,
        ready: 0,
        reserved: 0,
        history: []
    };
    saveWarehouse();
}

function saveWarehouse() {
    localStorage.setItem("warehouse", JSON.stringify(warehouse));
}

/* ========= КАЛЬКУЛЯТОР ========= */
function loadFeedTable() {
    let html = "";
    feedComponents.forEach((item, i) => {
        const name = item[0];
        const qty = item[1];
        const price = Number(localStorage.getItem("price_" + i)) || 0;

        html += `
            <tr>
                <td>${name}</td>
                <td><input class="qty" data-i="${i}" type="number" value="${qty}"></td>
                <td><input class="price" data-i="${i}" type="number" value="${price}"></td>
                <td id="sum_${i}">0.00</td>
            </tr>
        `;
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

    const perKg = totalKg ? total / totalKg : 0;
    const volume = Number(document.getElementById("feedVolume").value);

    document.getElementById("feedTotal").textContent = total.toFixed(2);
    document.getElementById("feedPerKg").textContent = perKg.toFixed(2);
    document.getElementById("feedVolumeTotal").textContent = (perKg * volume).toFixed(2);
}

document.addEventListener("input", calculateFeed);
loadFeedTable();

/* ========= ВІДОБРАЖЕННЯ СКЛАДУ ========= */
function renderWarehouse() {
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
            </tr>
        `;
    });

    document.getElementById("warehouseTable").innerHTML = html;

    document.querySelectorAll(".addStock").forEach(inp => {
        inp.addEventListener("change", e => {
            const name = e.target.dataset.name;
            const value = Number(e.target.value);

            if (value > 0) {
                warehouse.feed[name] = (warehouse.feed[name] || 0) + value;
                saveWarehouse();
                renderWarehouse();
            }
        });
    });

    document.getElementById("trayStock").value = warehouse.trays;
    document.getElementById("fullTrays").textContent = warehouse.ready;
    document.getElementById("reservedTrays").textContent = warehouse.reserved;
    document.getElementById("mixHistory").innerHTML = warehouse.history.map(h => `<li>${h}</li>`).join("");
}

renderWarehouse();

/* ========= ЗРОБИТИ КОРМ ========= */
document.getElementById("makeFeedBtn").addEventListener("click", () => {
    for (let c of feedComponents) {
        const name = c[0];
        const need = c[1];
        if ((warehouse.feed[name] || 0) < need) {
            alert("Недостатньо: " + name);
            return;
        }
    }

    feedComponents.forEach(c => {
        warehouse.feed[c[0]] -= c[1];
    });

    warehouse.history.push("Заміс " + new Date().toLocaleString());
    saveWarehouse();
    renderWarehouse();
});

document.getElementById("trayStock").addEventListener("input", e => {
    warehouse.trays = Number(e.target.value);
    saveWarehouse();
});

/* ========= ЯЙЦЯ ========= */
let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");

function saveEggRecord() {
    const date = eggsDate.value || new Date().toISOString().slice(0, 10);
    const good = Number(eggsGood.value) || 0;
    const bad = Number(eggsBad.value) || 0;
    const home = Number(eggsHome.value) || 0;

    const commercial = good - bad - home;

    const fullTrays = Math.floor(commercial / 20);
    const left = commercial % 20;

    eggs[date] = { good, bad, home, commercial, fullTrays, left };

    localStorage.setItem("eggs", JSON.stringify(eggs));

    // показ інформації
    if (commercial < 20) {
        eggsInfo.innerHTML = `Зібрано ${commercial} яєць — до повного лотка не вистачає ${20 - commercial}.`;
    } else {
        eggsInfo.innerHTML = `Повних лотків: ${fullTrays}. Залишок: ${left} яєць.`;
    }

    showEggs();
}

function showEggs() {
    let html = "";

    Object.keys(eggs).sort().reverse().forEach(d => {
        const e = eggs[d];

        html += `
            <div class="egg-entry">
                <b>${d}</b> — ${e.good} / ${e.bad} / ${e.home} → ${e.fullTrays} лотків
            </div>
        `;
    });

    document.getElementById("eggsList").innerHTML = html;
}

showEggs();

/* ========= ЗАМОВЛЕННЯ ========= */
let orders = JSON.parse(localStorage.getItem("orders") || "{}");

function addOrder() {
    const date = orderDate.value || new Date().toISOString().slice(0, 10);

    if (!orders[date]) orders[date] = [];

    const order = {
        name: orderName.value,
        trays: Number(orderTrays.value),
        details: orderDetails.value,
        status: "активне"
    };

    orders[date].push(order);

    warehouse.reserved += order.trays;
    saveWarehouse();
    localStorage.setItem("orders", JSON.stringify(orders));

    showOrders();
}

function showOrders() {
    let html = "";

    Object.keys(orders).sort().reverse().forEach(date => {
        html += `<h3>${date}</h3>`;

        orders[date].forEach((o, i) => {
            html += `
                <div class="order-entry">
                    <b>${o.name}</b> — ${o.trays} лотків (${o.status})
                    <br>${o.details}
                    <br>
                    <button onclick="setStatus('${date}', ${i}, 'виконано')">✅ Виконано</button>
                    <button onclick="setStatus('${date}', ${i}, 'скасовано')">❌ Скасовано</button>
                </div>
            `;
        });
    });

    document.getElementById("ordersList").innerHTML = html;
}

function setStatus(date, index, status) {
    const ord = orders[date][index];

    if (status === "виконано") {
        warehouse.ready -= ord.trays;
        warehouse.reserved -= ord.trays;
    }

    if (status === "скасовано") {
        warehouse.reserved -= ord.trays;
    }

    ord.status = status;

    saveWarehouse();
    localStorage.setItem("orders", JSON.stringify(orders));

    renderWarehouse();
    showOrders();
}

showOrders();