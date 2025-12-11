/* ===== ПЕРЕМИКАЧ ТЕМИ ===== */
document.querySelector(".theme-switch").addEventListener("click", () => {
    document.body.classList.toggle("light");
});

/* ===== НАВІГАЦІЯ ===== */
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        let page = btn.dataset.page;
        if (!page) return;

        document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
        document.getElementById("page-" + page).classList.add("active-page");

        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

/* ===== КАЛЬКУЛЯТОР ===== */
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

function loadFeed() {
    let html = "";
    feedComponents.forEach((c, i) => {
        let p = localStorage.getItem("p" + i) || 0;
        html += `
        <tr>
            <td>${c[0]}</td>
            <td><input id="qty${i}" value="${c[1]}"></td>
            <td><input id="price${i}" value="${p}"></td>
            <td id="sum${i}">0</td>
        </tr>`;
    });
    document.getElementById("feedTable").innerHTML = html;
    calcFeed();
}
loadFeed();

function calcFeed() {
    let total = 0, kg = 0;

    feedComponents.forEach((c, i) => {
        let q = +document.getElementById("qty" + i).value;
        let p = +document.getElementById("price" + i).value;
        localStorage.setItem("p" + i, p);

        let s = q * p;
        total += s;
        kg += q;

        document.getElementById("sum" + i).innerText = s.toFixed(2);
    });

    let per = kg ? total / kg : 0;
    let vol = +document.getElementById("feedVolume").value;

    document.getElementById("feedTotal").innerText = total.toFixed(2);
    document.getElementById("feedPerKg").innerText = per.toFixed(2);
    document.getElementById("feedVolumeTotal").innerText = (per * vol).toFixed(2);
}
document.addEventListener("input", calcFeed);

/* ===== ЯЙЦЯ ===== */
let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");

function saveEggRecord() {
    let d = document.getElementById("eggsDate").value || new Date().toISOString().slice(0,10);
    eggs[d] = {
        good:+eggsGood.value||0,
        bad:+eggsBad.value||0,
        home:+eggsHome.value||0
    };
    localStorage.setItem("eggs", JSON.stringify(eggs));
    showEggs();
}

function showEggs() {
    let out = "";
    Object.keys(eggs).sort().reverse().forEach(d => {
        let e = eggs[d];
        let com = e.good - e.bad - e.home;
        let trays = Math.floor(com / 20);
        out += `
        <div class="w-row">
            <b>${d}</b><br>
            Всього: ${e.good}<br>
            Брак: ${e.bad}<br>
            Дім: ${e.home}<br>
            Комерційні: ${com}<br>
            Лотки: ${trays}<br>
        </div>`;
    });
    document.getElementById("eggsList").innerHTML = out;
}
showEggs();

/* ===== ЗАМОВЛЕННЯ ===== */
let orders = JSON.parse(localStorage.getItem("orders") || "{}");

function addOrder() {
    let d = orderDate.value || new Date().toISOString().slice(0,10);
    if (!orders[d]) orders[d] = [];

    orders[d].push({
        name:orderName.value,
        trays:+orderTrays.value,
        details:orderDetails.value,
        status:"active"
    });

    localStorage.setItem("orders", JSON.stringify(orders));
    showOrders();
}

function showOrders() {
    let out="";
    Object.keys(orders).sort().reverse().forEach(d=>{
        out += `<h3>${d}</h3>`;
        orders[d].forEach((o,i)=>{
            out += `
            <div class="w-row">
                <b>${o.name}</b> — ${o.trays} лот.<br>
                ${o.details}<br>
                Статус: ${o.status}
            </div>`;
        });
    });
    document.getElementById("ordersList").innerHTML = out;
}
showOrders();

/* ===== ФІНАНСИ ===== */
function saveFinanceSettings() {
    localStorage.setItem("trayPrice", trayPrice.value);
    showFinance();
}

function showFinance() {
    let price = +(localStorage.getItem("trayPrice") || 50);
    let income = 0;

    Object.values(orders).forEach(list=>{
        list.forEach(o=>{
            if (o.status === "completed") {
                income += o.trays * price;
            }
        });
    });

    financeReport.innerHTML = `<b>Дохід:</b> ${income} грн`;
}
showFinance();

/* ===== СКЛАД ===== */
let warehouse = JSON.parse(localStorage.getItem("warehouse") || "{}");

if (Object.keys(warehouse).length === 0) {
    warehouse = {
        grain:{name:"Зерно", unit:"кг", items:{}},
        cake:{name:"Макуха", unit:"кг", items:{}},
        minerals:{name:"Мінерали", unit:"кг", items:{}},
        packing:{name:"Упаковка", unit:"шт", items:{}},
        ready:{name:"Готова продукція", unit:"шт", items:{}}
    };
    saveWarehouse();
}

function saveWarehouse() {
    localStorage.setItem("warehouse", JSON.stringify(warehouse));
}

function renderWarehouse() {
    let out="";
    for (let key in warehouse) {
        let cat = warehouse[key];
        out += `<h3>${cat.name}</h3>`;

        for (let item in cat.items) {
            out += `<div class="w-row">${item}: ${cat.items[item]} ${cat.unit}</div>`;
        }

        out += `
        <div class="w-add">
            <input id="name-${key}" placeholder="Назва">
            <input id="qty-${key}" type="number" placeholder="К-сть">
            <button onclick="addItem('${key}')">Додати</button>
        </div>`;
    }
    document.getElementById("warehouseList").innerHTML = out;
}
renderWarehouse();

function addItem(cat) {
    let name = document.getElementById("name-"+cat).value;
    let qty = +document.getElementById("qty-"+cat).value;

    if (!name || qty <= 0) return;

    if (!warehouse[cat].items[name]) warehouse[cat].items[name] = 0;
    warehouse[cat].items[name] += qty;

    saveWarehouse();
    renderWarehouse();
}

/* ===== CSV ===== */
function exportCSV() {
    let rows=["Дата,Імʼя,Лотки,Деталі,Статус"];
    Object.keys(orders).forEach(d=>{
        orders[d].forEach(o=>{
            rows.push(`${d},${o.name},${o.trays},${o.details},${o.status}`);
        });
    });

    let csv=rows.join("\n");
    let blob=new Blob([csv],{type:"text/csv"});
    let a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="finance.csv";
    a.click();
}