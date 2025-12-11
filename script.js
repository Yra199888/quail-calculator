/* ============================  
      ТЕМА  
============================ */
const themeBtn = document.getElementById("themeSwitch");
themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    themeBtn.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
});

/* ============================  
      ПЕРЕМИКАННЯ ВКЛАДОК  
============================ */
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const page = btn.dataset.page;
        if (!page) return;

        document.querySelectorAll(".page").forEach(p =>
            p.classList.remove("active-page")
        );
        document.getElementById("page-" + page).classList.add("active-page");

        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

/* ============================  
      КАЛЬКУЛЯТОР  
============================ */

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

    feedComponents.forEach((comp, i) => {
        let price = localStorage.getItem("p" + i) || 0;

        html += `
        <tr>
            <td>${comp[0]}</td>
            <td><input type="number" id="qty${i}" value="${comp[1]}"></td>
            <td><input type="number" id="price${i}" value="${price}"></td>
            <td id="sum${i}">0</td>
        </tr>`;
    });

    document.getElementById("feedTable").innerHTML = html;
    calcFeed();
}

function calcFeed() {
    let total = 0;
    let kg = 0;

    feedComponents.forEach((c, i) => {
        let qty = +document.getElementById("qty" + i).value;
        let price = +document.getElementById("price" + i).value;

        localStorage.setItem("p" + i, price);

        let s = qty * price;
        document.getElementById("sum" + i).textContent = s.toFixed(2);

        total += s;
        kg += qty;
    });

    let perKg = kg ? total / kg : 0;
    let vol = +document.getElementById("feedVolume").value;

    document.getElementById("feedTotal").textContent = total.toFixed(2);
    document.getElementById("feedPerKg").textContent = perKg.toFixed(2);
    document.getElementById("feedVolumeTotal").textContent = (perKg * vol).toFixed(2);
}

document.addEventListener("input", calcFeed);
loadFeed();

/* ============================  
          ЯЙЦЯ  
============================ */

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
    updateTrayStock();
}

function renderEggs() {
    let out = "";

    Object.keys(eggs).sort().reverse().forEach(d => {
        let e = eggs[d];
        let commercial = e.good - e.bad - e.home;
        let trays = Math.floor(commercial / 20);

        out += `
        <div class="order-block">
            <b>${d}</b><br>
            Всього: ${e.good}<br>
            Брак: ${e.bad}<br>
            Дім: ${e.home}<br>
            Комерційні: ${commercial}<br>
            Лотки: ${trays}<br>
        </div>`;
    });

    document.getElementById("eggsList").innerHTML = out;
}

renderEggs();

/* ============================  
      ЛОГІКА СКЛАДУ  
============================ */

let warehouse = JSON.parse(localStorage.getItem("warehouse") || "{}");

// Якщо порожній — шаблон
if (!warehouse.components) {
    warehouse = {
        components: {},
        readyFeed: 0,
        feedHistory: [],
        trays: 0,
        bookedTrays: 0
    };
    feedComponents.forEach(c => warehouse.components[c[0]] = { incoming: 0, need: c[1], left: 0 });
    saveWarehouse();
}

function saveWarehouse() {
    localStorage.setItem("warehouse", JSON.stringify(warehouse));
}

function renderWarehouse() {
    let html = `
        <table class="feed-table">
            <tr>
                <th>Компонент</th>
                <th>Прихід</th>
                <th>Норма</th>
                <th>Залишок</th>
            </tr>
    `;

    for (let name in warehouse.components) {
        let item = warehouse.components[name];
        html += `
            <tr>
                <td>${name}</td>
                <td><input type="number" data-in="${name}" value="${item.incoming}"></td>
                <td>${item.need}</td>
                <td>${item.left}</td>
            </tr>
        `;
    }

    html += `</table>
    <button id="makeFeedBtn">Зробити корм</button>
    <h3>Історія виробництва</h3>
    <div>${warehouse.feedHistory.map(h => `<div>🔧 ${h}</div>`).join("")}</div>

    <h3>Лотки</h3>
    <p>Всього: ${warehouse.trays}</p>
    <p>Заброньовано: ${warehouse.bookedTrays}</p>
    `;

    document.getElementById("warehouseList").innerHTML = html;

    document.querySelectorAll("[data-in]").forEach(inp => {
        inp.addEventListener("input", () => {
            warehouse.components[inp.dataset.in].incoming = +inp.value;
            saveWarehouse();
        });
    });

    document.getElementById("makeFeedBtn").addEventListener("click", makeFeed);
}

renderWarehouse();

/* ============================  
     ЗРОБИТИ КОРМ  
============================ */

function makeFeed() {
    // Перевірка залишку
    for (let name in warehouse.components) {
        let comp = warehouse.components[name];
        if (comp.left + comp.incoming < comp.need) {
            alert("Недостатньо компоненту: " + name);
            return;
        }
    }

    // Списання
    for (let name in warehouse.components) {
        let c = warehouse.components[name];
        c.left = c.left + c.incoming - c.need;
        c.incoming = 0;
    }

    warehouse.readyFeed += 1;
    warehouse.feedHistory.push(new Date().toLocaleString());

    saveWarehouse();
    renderWarehouse();
}

/* ============================  
   АВТО-СПИСАННЯ ЛОТКІВ  
============================ */

function updateTrayStock() {
    let totalCommercialEggs = 0;

    Object.values(eggs).forEach(r => {
        totalCommercialEggs += (r.good - r.bad - r.home);
    });

    let trays = Math.floor(totalCommercialEggs / 20);

    warehouse.trays = trays;
    saveWarehouse();
    renderWarehouse();
}

updateTrayStock();