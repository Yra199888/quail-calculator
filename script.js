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
        document.querySelector("#page-" + page).classList.add("active-page");

        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

/* =========================
   ДАНІ КОМПОНЕНТІВ
========================= */
const feedComponents = [
    "Кукурудза",
    "Пшениця",
    "Ячмінь",
    "Соєва макуха",
    "Соняшникова макуха",
    "Рибне борошно",
    "Дріжджі",
    "Трикальційфосфат",
    "Dolfos D",
    "Сіль"
];

/*
Структура складу:

warehouse = {
  "Кукурудза": { incoming: 0, perBatch: 10, left: 0 }
}
*/

let warehouse = JSON.parse(localStorage.getItem("warehouse")) || {};
let mixHistory = JSON.parse(localStorage.getItem("mixHistory")) || [];
let trayStock = JSON.parse(localStorage.getItem("trayStock")) || { count: 100 };
let fullTrays = JSON.parse(localStorage.getItem("fullTrays")) || { ready: 0, booked: 0 };

/* =========================
   1. СТВОРЕННЯ ПУСТОЇ СТРУКТУРИ
========================= */
feedComponents.forEach(name => {
    if (!warehouse[name]) {
        warehouse[name] = {
            incoming: 0,
            perBatch: 0,
            left: 0
        };
    }
});
saveWarehouse();

/* =========================
   ЗБЕРЕЖЕННЯ
========================= */
function saveWarehouse() {
    localStorage.setItem("warehouse", JSON.stringify(warehouse));
}
function saveHistory() {
    localStorage.setItem("mixHistory", JSON.stringify(mixHistory));
}
function saveTrayStock() {
    localStorage.setItem("trayStock", JSON.stringify(trayStock));
}
function saveFullTrays() {
    localStorage.setItem("fullTrays", JSON.stringify(fullTrays));
}

/* =========================
   РЕНДЕР ТАБЛИЦІ СКЛАДУ
========================= */
function renderWarehouse() {
    let html = `
    <table class="feed-table">
        <tr>
            <th>Компонент</th>
            <th>Прихід (кг)</th>
            <th>На 1 заміс (кг)</th>
            <th>Залишок (кг)</th>
        </tr>
    `;

    feedComponents.forEach(name => {
        html += `
        <tr>
            <td>${name}</td>
            <td><input type="number" step="0.1" value="${warehouse[name].incoming}" onchange="updateIncoming('${name}', this.value)"></td>
            <td><input type="number" step="0.1" value="${warehouse[name].perBatch}" onchange="updatePerBatch('${name}', this.value)"></td>
            <td>${warehouse[name].left.toFixed(2)}</td>
        </tr>`;
    });

    html += `</table>
    <button class="btn-make" onclick="makeFeed()">🔄 Зробити корм</button>

    <h3>📘 Історія замісів</h3>
    <div id="mixHistoryBox"></div>

    <h3>📦 Запаси лотків</h3>
    <table class="feed-table">
        <tr><th>Тип</th><th>Кількість (шт)</th></tr>
        <tr>
            <td>Лотки 20 шт</td>
            <td><input type="number" value="${trayStock.count}" onchange="updateTrayStock(this.value)"></td>
        </tr>
    </table>

    <h3>🥚 Повні лотки</h3>
    Готові лотки: <b>${fullTrays.ready}</b><br>
    Заброньовані: <b>${fullTrays.booked}</b>
    `;

    document.getElementById("warehouseList").innerHTML = html;

    renderHistory();
}

/* =========================
   ОНОВЛЕННЯ ПОЛІВ
========================= */
function updateIncoming(name, val) {
    warehouse[name].incoming = Number(val);
    warehouse[name].left += Number(val);
    saveWarehouse();
    renderWarehouse();
}

function updatePerBatch(name, val) {
    warehouse[name].perBatch = Number(val);
    saveWarehouse();
}

/* =========================
   ЗРОБИТИ КОРМ
========================= */
function makeFeed() {
    // Перевірка чи вистачає всіх компонентів
    for (let name of feedComponents) {
        let need = warehouse[name].perBatch;
        if (warehouse[name].left < need) {
            alert("Недостатньо компоненту: " + name);
            return;
        }
    }

    // Списання
    feedComponents.forEach(name => {
        warehouse[name].left -= warehouse[name].perBatch;
    });

    saveWarehouse();

    // Додаємо запис в історію
    let d = new Date().toLocaleString("uk-UA");
    mixHistory.push(d);
    saveHistory();

    renderWarehouse();

    alert("Корм успішно зроблено!");
}

/* =========================
   РЕНДЕР ІСТОРІЇ ЗАМІСІВ
========================= */
function renderHistory() {
    if (mixHistory.length === 0) {
        document.getElementById("mixHistoryBox").innerHTML = "<i>Поки що немає записів</i>";
        return;
    }

    let html = "";
    mixHistory.slice().reverse().forEach(h => {
        html += `<div class="history-row">🔹 ${h}</div>`;
    });

    document.getElementById("mixHistoryBox").innerHTML = html;
}

/* =========================
   ЛОТКИ
========================= */
function updateTrayStock(val) {
    trayStock.count = Number(val);
    saveTrayStock();
}

/* =========================
   СТАРТОВИЙ РЕНДЕР
========================= */
renderWarehouse();