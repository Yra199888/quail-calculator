// === Тема ===
const themeSwitch = document.getElementById("themeSwitch");
themeSwitch.addEventListener("click", () => {
    document.body.classList.toggle("light");
    themeSwitch.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
});

// === Навігація ===
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

// ========== СКЛАД ==========
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

function renderWarehouse() {
    let html = "";
    feedComponents.forEach(item => {
        const name = item[0], need = item[1];
        const stock = warehouse.feed[name] || 0;
        html += `
        <tr>
            <td>${name}</td>
            <td><input type="number" class="addStock" data-name="${name}" value="0"></td>
            <td>${need}</td>
            <td>${stock.toFixed(2)}</td>
        </tr>`;
    });
    document.getElementById("warehouseTable").innerHTML = html;

    document.querySelectorAll(".addStock").forEach(inp => {
        inp.addEventListener("change", e => {
            const name = e.target.dataset.name;
            const val = +e.target.value;
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

    // історія замісів
    const list = warehouse.history.map(x => `<li>${x}</li>`).join("");
    document.getElementById("mixHistory").innerHTML = list ? `<ul>${list}</ul>` : "<i>Порожньо</i>";
}

renderWarehouse();

// Зробити корм
document.getElementById("makeFeedBtn").addEventListener("click", () => {
    for (let i of feedComponents) {
        const name = i[0], need = i[1];
        if ((warehouse.feed[name] || 0) < need) {
            alert(`Недостатньо складового: ${name}`);
            return;
        }
    }
    feedComponents.forEach(i => warehouse.feed[i[0]] -= i[1]);

    const now = new Date().toLocaleString();
    warehouse.history.push("Заміс: " + now);

    // якщо після замісу всі компоненти наявні
    warehouse.ready += 1;
    saveWarehouse();
    renderWarehouse();
});

// зміна кількості лотків на складі
document.getElementById("trayStock").addEventListener("change", e => {
    warehouse.trays = +e.target.value;
    saveWarehouse();
});

// ========== ЯЙЦЯ ==========
let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");
function saveEggRecord() {
    const d = eggsDate.value || new Date().toISOString().slice(0, 10);
    const good = +eggsGood.value || 0;
    const bad = +eggsBad.value || 0;
    const home = +eggsHome.value || 0;

    const commercial = good - bad - home;
    const trays20 = Math.floor(commercial / 20);
    const leftoverEggs = commercial % 20;

    eggs[d] = {
        good, bad, home, commercial, trays20, leftoverEggs
    };
    localStorage.setItem("eggs", JSON.stringify(eggs));

    // ------------ Вивід info ------------
    let infoHTML = "";
    if (commercial < 20) {
        infoHTML = `Зібрано ${commercial} яєць, до повного лотка не вистачає ${20 - commercial} шт.`;
    } else {
        infoHTML = `Повні лотки: ${trays20}, залишок: ${leftoverEggs} яєць`;
    }
    document.getElementById("eggsInfo").innerHTML = `<p>${infoHTML}</p>`;

    showEggs();
}

function showEggs() {
    let out = "";
    Object.keys(eggs).sort().reverse().forEach(d => {
        const e = eggs[d];
        out += `<div><b>${d}</b> — всього: ${e.good}, брак: ${e.bad}, для дому: ${e.home} → <b>${e.trays20}</b> лотків</div>`;
    });
    document.getElementById("eggsList").innerHTML = out;
}

showEggs();

// ========== ЗАМОВЛЕННЯ ==========
let orders = JSON.parse(localStorage.getItem("orders") || "{}");

function addOrder() {
    const d = orderDate.value || new Date().toISOString().slice(0, 10);
    if (!orders[d]) orders[d] = [];

    const traysNum = +orderTrays.value;
    const ord = {
        name: orderName.value,
        trays: traysNum,
        details: orderDetails.value,
        status: "активне"
    };

    orders[d].push(ord);
    warehouse.reserved += traysNum;

    saveWarehouse();
    localStorage.setItem("orders", JSON.stringify(orders));

    showOrders();
    renderWarehouse();
}

function showOrders() {
    let html = "";
    Object.keys(orders).sort().reverse().forEach(d => {
        html += `<h4>${d}</h4>`;
        orders[d].forEach((o, index) => {
            html += `
            <div class="order-entry">
                <b>${o.name}</b> — ${o.trays} лотків (${o.status})<br>
                <i>${o.details}</i><br>
                <button onclick="setStatus('${d}',${index},'виконано')">✅ Виконано</button>
                <button onclick="setStatus('${d}',${index},'скасовано')">❌ Скасовано</button>
            </div>`;
        });
    });
    document.getElementById("ordersList").innerHTML = html;
}

function setStatus(date, idx, newStatus) {
    const ord = orders[date][idx];
    if (ord.status === newStatus) return;

    // Update reserved/ready counts
    if (newStatus === "виконано") {
        warehouse.ready += ord.trays;
        warehouse.reserved -= ord.trays;
    }
    if (newStatus === "скасовано") {
        warehouse.reserved -= ord.trays;
    }

    orders[date][idx].status = newStatus;

    saveWarehouse();
    localStorage.setItem("orders", JSON.stringify(orders));

    showOrders();
    renderWarehouse();
}

showOrders();