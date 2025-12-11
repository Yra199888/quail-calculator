/* ===========================================
   ПЕРЕМИКАННЯ ТЕМИ
=========================================== */
const themeSwitch = document.getElementById("themeSwitch");
themeSwitch.addEventListener("click", () => {
    document.body.classList.toggle("light");
    themeSwitch.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
});


/* ===========================================
   НАВІГАЦІЯ СТОРІНКАМИ
=========================================== */
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


/* ===========================================
      КАЛЬКУЛЯТОР КОРМУ (НЕ ЧІПАЮ)
=========================================== */
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


/* ===========================================
      ОБЛІК ЯЄЦЬ (ОСНОВНЕ!)
=========================================== */

let eggsData = JSON.parse(localStorage.getItem("eggsData") || "{}");

function saveEggRecord() {
    const date = eggsDate.value || new Date().toISOString().slice(0, 10);
    const good = Number(eggsGood.value);
    const bad = Number(eggsBad.value);
    const home = Number(eggsHome.value);

    if (!good && !bad && !home) {
        alert("Введи хоч якісь дані");
        return;
    }

    const commercial = good - bad - home;

    // Повні лотки
    const fullTrays = Math.floor(commercial / 20);
    const leftover = commercial % 20;

    // Зберігаємо
    eggsData[date] = { good, bad, home, fullTrays, leftover };

    localStorage.setItem("eggsData", JSON.stringify(eggsData));

    // Вивід інформації під кнопкою
    let txt = "";

    if (fullTrays > 0) {
        txt += `🥚 Повні лотки: <b>${fullTrays}</b><br>`;
        if (leftover > 0) txt += `➕ Залишок: <b>${leftover}</b> яєць`;
    } else {
        txt = `Зібрано <b>${leftover}</b> яєць (до лотка не вистачає <b>${20 - leftover}</b>)`;
    }

    document.getElementById("eggsInfo").innerHTML = txt;

    renderEggsList();
}

function renderEggsList() {
    let html = "";

    Object.keys(eggsData).sort().reverse().forEach(date => {
        const d = eggsData[date];
        html += `
            <div class="egg-log">
                <b>${date}</b><br>
                Зібрано: ${d.good} • Брак: ${d.bad} • Дім: ${d.home}<br>
                Лотків: ${d.fullTrays} • Залишок: ${d.leftover}
            </div>
        `;
    });

    document.getElementById("eggsList").innerHTML = html;
}

renderEggsList();


/* ===========================================
      СКЛАД (НЕ ЧІПАЮ)
=========================================== */

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

function renderWarehouse() {
    let html = "";

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

    document.getElementById("warehouseTable").innerHTML = html;

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

    document.getElementById("trayStock").value = warehouse.trays["Лотки 20 шт"];
    document.getElementById("fullTrays").textContent = warehouse.readyTrays;
    document.getElementById("reservedTrays").textContent = warehouse.reservedTrays;
}

renderWarehouse();