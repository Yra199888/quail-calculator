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
      ЯЙЦЯ — ЛОГІКА
========================= */
let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");

function saveEggRecord() {
    const date = eggsDate.value || new Date().toISOString().slice(0, 10);
    const good = Number(eggsGood.value);
    const bad = Number(eggsBad.value);
    const home = Number(eggsHome.value);

    const commercial = good - bad - home;

    let trays = Math.floor(commercial / 20);
    let leftover = commercial % 20;

    let text = "";

    if (commercial < 20) {
        text = `${commercial} яєць (неповний лоток)`;
    } else {
        text = `${commercial} яєць → ${trays} лотків + ${leftover} лишилось`;
    }

    eggs[date] = {
        good, bad, home, commercial,
        trays, leftover,
        text
    };

    localStorage.setItem("eggs", JSON.stringify(eggs));
    renderEggsList();
}

function renderEggsList() {
    let html = "";
    for (let date in eggs) {
        html += `<p><b>${date}:</b> ${eggs[date].text}</p>`;
    }
    document.getElementById("eggsList").innerHTML = html;
}

renderEggsList();