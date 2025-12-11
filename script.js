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
      КАЛЬКУЛЯТОР КОРМУ
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
      СКЛАД — СТРУКТУРА
========================= */

let warehouse = JSON.parse(localStorage.getItem("warehouse") || "{}");

if (!warehouse.feed) {
    warehouse = {
        feed: {},             // залишки компонентів
        trays: { "Лотки 20 шт": 0 },
        mixHistory: [],       // історія замісів
        readyTrays: 0,
        reservedTrays: 0
    };
    saveWarehouse();
}

function saveWarehouse() {
    localStorage.setItem("warehouse", JSON.stringify(warehouse));
}

/* =========================
      ВИВІД СКЛАДУ
========================= */

function renderWarehouse() {
    let html = `
    <h3>Таблиця складу</h3>
    <table class="feed-table">
        <tr>
            <th>Компонент</th>
            <th>Прихід (кг)</th>
            <th>На 1 заміс (кг)</th>
            <th>Залишок (кг)</th>
        </tr>
    `;

    feedComponents.forEach(item => {
        const name = item[0];
        const perMix = item[1];
        const stock = warehouse.feed[name] || 0;

        html += `
        <tr>
            <td>${name}</td>
            <td><input class="warehouse-add" data-name="${name}" type="number" value="0"></td>
            <td>${perMix}</td>
            <td>${stock.toFixed(2)}</td>
        </tr>`;
    });

    html += `</table>
    <button id="makeFeedBtn">♻️ Зробити корм</button>

    <h3>📘 Історія замісів</h3>
    ${warehouse.mixHistory.length === 0 ? "<i>Порожньо</i>" : ""}

    <ul>
        ${warehouse.mixHistory.map(h => `<li>${h}</li>`).join("")}
    </ul>

    <h3>🗄️ Запаси лотків</h3>
    <table class="feed-table">
        <tr><th>Тип</th><th>Кількість (шт)</th></tr>
        <tr>
            <td>Лотки 20 шт</td>
            <td><input id="trayInput" type="number" value="${warehouse.trays["Лотки 20 шт"]}"></td>
        </tr>
    </table>

    <h3>🥚 Повні лотки</h3>
    Готові лотки: <b>${warehouse.readyTrays}</b><br>
    Заброньовані: <b>${warehouse.reservedTrays}</b><br>
    `;

    document.getElementById("warehouseList").innerHTML = html;

    document.querySelectorAll(".warehouse-add").forEach(inp => {
        inp.addEventListener("change", e => {
            const name = e.target.dataset.name;
            const val = Number(e.target.value);
            if (val > 0) {
                warehouse.feed[name] = (warehouse.feed[name] || 0) + val;
                saveWarehouse();
                renderWarehouse();
            }
        });
    });

    document.getElementById("trayInput").addEventListener("change", e => {
        warehouse.trays["Лотки 20 шт"] = Number(e.target.value);
        saveWarehouse();
    });

    document.getElementById("makeFeedBtn").addEventListener("click", makeFeed);
}

renderWarehouse();

/* =========================
      ЗРОБИТИ КОРМ
========================= */

function makeFeed() {
    // перевірка наявності компонентів
    for (let item of feedComponents) {
        const name = item[0];
        const need = item[1];

        if (!warehouse.feed[name] || warehouse.feed[name] < need) {
            alert(`Недостатньо компоненту: ${name}`);
            return;
        }
    }

    // списуємо
    feedComponents.forEach(item => {
        const name = item[0];
        const need = item[1];
        warehouse.feed[name] -= need;
    });

    warehouse.mixHistory.push("Заміс: " + new Date().toLocaleString());
    saveWarehouse();
    renderWarehouse();
}

/* =========================
     ЯЙЦЯ → АВТО-ЛОТКИ
========================= */

let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");

function saveEggRecord() {
    const date = eggsDate.value || new Date().toISOString().slice(0, 10);
    const good = Number(eggsGood.value);
    const bad = Number(eggsBad.value);
    const home = Number(eggsHome.value);

    const commercial = good - bad - home;
    const trays20 = Math.floor(commercial / 20);

    warehouse.readyTrays += trays20;
    if (warehouse.trays["Лотки 20 шт"] < trays20) {
        alert("Недостатньо лотків!");
    } else {
        warehouse.trays["Лotки 20 шт"] -= trays20;
    }

    eggs[date] = { good, bad, home, commercial, trays: trays20 };

    localStorage.setItem("eggs", JSON.stringify(eggs));
    saveWarehouse();
}