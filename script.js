// ============================
//      ТЕМА (ніч / день)
// ============================
const themeSwitch = document.getElementById("themeSwitch");
if (themeSwitch) {
  themeSwitch.addEventListener("click", () => {
    document.body.classList.toggle("light");
    themeSwitch.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
  });
}

// ============================
//      НАВІГАЦІЯ
// ============================
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const page = btn.dataset.page;
    if (!page) return; // кнопка теми

    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active-page"));

    const target = document.getElementById("page-" + page);
    if (target) target.classList.add("active-page");

    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// ============================
//      КОМПОНЕНТИ КОРМУ
// ============================
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
  ["Сіль", 0.05],
];

// ============================
//      КАЛЬКУЛЯТОР КОРМУ
// ============================
function loadFeedTable() {
  const tbody = document.getElementById("feedTable");
  if (!tbody) return;

  let html = "";
  feedComponents.forEach((item, i) => {
    const price = localStorage.getItem("price_" + i) || 0;
    const qty = localStorage.getItem("qty_" + i) ?? item[1];

    html += `
      <tr>
        <td>${item[0]}</td>
        <td><input class="qty" data-i="${i}" type="number" value="${qty}"></td>
        <td><input class="price" data-i="${i}" type="number" value="${price}"></td>
        <td id="sum_${i}">0</td>
      </tr>`;
  });

  tbody.innerHTML = html;
  calculateFeed();

  document.querySelectorAll(".qty, .price, #feedVolume").forEach((el) => {
    el.addEventListener("input", calculateFeed);
  });
}

function calculateFeed() {
  let total = 0;
  let totalKg = 0;

  feedComponents.forEach((item, i) => {
    const qtyEl = document.querySelector(`.qty[data-i="${i}"]`);
    const priceEl = document.querySelector(`.price[data-i="${i}"]`);
    const qty = Number(qtyEl?.value) || 0;
    const price = Number(priceEl?.value) || 0;

    localStorage.setItem("qty_" + i, qty);
    localStorage.setItem("price_" + i, price);

    const sum = qty * price;
    total += sum;
    totalKg += qty;

    const sumCell = document.getElementById("sum_" + i);
    if (sumCell) sumCell.textContent = sum.toFixed(2);
  });

  const perKg = totalKg ? total / totalKg : 0;
  const volume = Number(document.getElementById("feedVolume")?.value) || 0;

  const totalEl = document.getElementById("feedTotal");
  const perKgEl = document.getElementById("feedPerKg");
  const volTotalEl = document.getElementById("feedVolumeTotal");

  if (totalEl) totalEl.textContent = total.toFixed(2);
  if (perKgEl) perKgEl.textContent = perKg.toFixed(2);
  if (volTotalEl) volTotalEl.textContent = (perKg * volume).toFixed(2);
}

loadFeedTable();

// ============================
//      СКЛАД
// ============================
let warehouse = JSON.parse(localStorage.getItem("warehouse") || "{}");

// ВАЖЛИВО: додаємо поля, щоб не ламати старі збереження
if (!warehouse.feed) warehouse.feed = {};
if (typeof warehouse.trays !== "number") warehouse.trays = 0;        // пусті лотки (якщо ти так ведеш)
if (typeof warehouse.reserved !== "number") warehouse.reserved = 0;  // активні замовлення
if (!Array.isArray(warehouse.history)) warehouse.history = [];

// Нове: скільки лотків ВЖЕ віддали (виконані замовлення)
if (typeof warehouse.delivered !== "number") warehouse.delivered = 0;

// Нове: залишок яєць після перерахунку
if (typeof warehouse.eggRemainder !== "number") warehouse.eggRemainder = 0;

// Нове: скільки лотків всього “назбирано” по яйцях
if (typeof warehouse.producedTrays !== "number") warehouse.producedTrays = 0;

// Нове: скільки лотків зараз готових на складі (produced - delivered)
if (typeof warehouse.ready !== "number") warehouse.ready = 0;

function saveWarehouse() {
  localStorage.setItem("warehouse", JSON.stringify(warehouse));
}
saveWarehouse();

function renderWarehouse() {
  const tbody = document.getElementById("warehouseTable");
  if (!tbody) return;

  let html = "";
  feedComponents.forEach((item) => {
    const name = item[0];
    const need = item[1];
    const stock = warehouse.feed[name] || 0;

    html += `
      <tr>
        <td>${name}</td>
        <td><input class="addStock" data-name="${name}" type="number" value="0"></td>
        <td>${need}</td>
        <td>${stock.toFixed(2)}</td>
      </tr>`;
  });

  tbody.innerHTML = html;

  document.querySelectorAll(".addStock").forEach((inp) => {
    inp.addEventListener("change", (e) => {
      const name = e.target.dataset.name;
      const val = Number(e.target.value) || 0;
      if (val > 0) {
        warehouse.feed[name] = (warehouse.feed[name] || 0) + val;
        saveWarehouse();
        renderWarehouse();
      }
    });
  });

  const trayStockEl = document.getElementById("trayStock");
  if (trayStockEl) {
    trayStockEl.value = warehouse.trays;
    trayStockEl.onchange = (e) => {
      warehouse.trays = Number(e.target.value) || 0;
      saveWarehouse();
    };
  }

  const fullTraysEl = document.getElementById("fullTrays");
  const reservedTraysEl = document.getElementById("reservedTrays");
  if (fullTraysEl) fullTraysEl.textContent = String(warehouse.ready);
  if (reservedTraysEl) reservedTraysEl.textContent = String(warehouse.reserved);

  const mixHistory = document.getElementById("mixHistory");
  if (mixHistory) {
    mixHistory.innerHTML = warehouse.history.length
      ? "<ul>" + warehouse.history.map((x) => `<li>${x}</li>`).join("") + "</ul>"
      : "<i>Порожньо</i>";
  }
}

renderWarehouse();

// Кнопка "Зробити корм"
const makeFeedBtn = document.getElementById("makeFeedBtn");
if (makeFeedBtn) {
  makeFeedBtn.addEventListener("click", () => {
    for (let item of feedComponents) {
      const name = item[0];
      const need = item[1];
      if ((warehouse.feed[name] || 0) < need) {
        alert(`Недостатньо компоненту: ${name}`);
        return;
      }
    }

    feedComponents.forEach((item) => {
      warehouse.feed[item[0]] -= item[1];
    });

    warehouse.history.push("Заміс: " + new Date().toLocaleString());
    saveWarehouse();
    renderWarehouse();
  });
}

// ============================
//      ЯЙЦЯ (редагування + перенос залишку)
// ============================
let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");

// Безпечна нормалізація старих записів
function normalizeEggRecord(obj) {
  const good = Number(obj?.good) || 0;
  const bad = Number(obj?.bad) || 0;
  const home = Number(obj?.home) || 0;
  const commercial = Math.max(good - bad - home, 0);
  return { good, bad, home, commercial };
}

// Перерахунок: сумуємо всі комерційні яйця за всі дні,
// робимо producedTrays / eggRemainder,
// а ready = producedTrays - delivered (але не менше 0)
function recalcEggTotalsToWarehouse() {
  const totalCommercial = Object.keys(eggs).reduce((sum, d) => {
    const e = normalizeEggRecord(eggs[d]);
    return sum + e.commercial;
  }, 0);

  const producedTrays = Math.floor(totalCommercial / 20);
  const eggRemainder = totalCommercial % 20;

  warehouse.producedTrays = producedTrays;
  warehouse.eggRemainder = eggRemainder;

  // готові на складі = назбирано - віддано
  warehouse.ready = Math.max(warehouse.producedTrays - (warehouse.delivered || 0), 0);

  saveWarehouse();
  renderWarehouse();
  showOrders(); // щоб “вільні/замовлено” оновились
}

// Текст під кнопкою "Зберегти" у вкладці Яйця
function updateEggsInfoBox() {
  const info = document.getElementById("eggsInfo");
  if (!info) return;

  const totalCommercial = Object.keys(eggs).reduce((sum, d) => sum + normalizeEggRecord(eggs[d]).commercial, 0);
  const trays = Math.floor(totalCommercial / 20);
  const rem = totalCommercial % 20;

  if (totalCommercial < 20) {
    info.innerHTML = `🥚 На залишку: <b>${totalCommercial}</b> яєць`;
  } else {
    info.innerHTML = `📦 Разом: <b>${trays}</b> повних лотків, залишок <b>${rem}</b> яєць`;
  }
}

// Додати/оновити запис (кнопка "Зберегти")
function saveEggRecord() {
  const dateEl = document.getElementById("eggsDate");
  const goodEl = document.getElementById("eggsGood");
  const badEl = document.getElementById("eggsBad");
  const homeEl = document.getElementById("eggsHome");

  const date = dateEl?.value || new Date().toISOString().slice(0, 10);
  const good = Number(goodEl?.value) || 0;
  const bad = Number(badEl?.value) || 0;
  const home = Number(homeEl?.value) || 0;

  eggs[date] = { good, bad, home };
  localStorage.setItem("eggs", JSON.stringify(eggs));

  // головне: не “додаємо” лотки, а РАХУЄМО по факту
  recalcEggTotalsToWarehouse();
  updateEggsInfoBox();
  renderEggsReport();
}

// Рендер щоденного звіту з редагуванням
function renderEggsReport() {
  const list = document.getElementById("eggsList");
  if (!list) return;

  const dates = Object.keys(eggs).sort().reverse();
  if (!dates.length) {
    list.innerHTML = "<i>Записів немає</i>";
    return;
  }

  let html = "";

  dates.forEach((d) => {
    const e = normalizeEggRecord(eggs[d]);
    const trays = Math.floor(e.commercial / 20);
    const remainder = e.commercial % 20;

    html += `
      <div class="egg-entry" style="margin-bottom:12px;">
        <b>${d}</b><br>

        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:8px;">
          <label style="opacity:.85;">Всього:
            <input type="number" class="egg-edit" data-date="${d}" data-field="good" value="${e.good}" style="max-width:110px;">
          </label>

          <label style="opacity:.85;">Брак:
            <input type="number" class="egg-edit" data-date="${d}" data-field="bad" value="${e.bad}" style="max-width:110px;">
          </label>

          <label style="opacity:.85;">Дім:
            <input type="number" class="egg-edit" data-date="${d}" data-field="home" value="${e.home}" style="max-width:110px;">
          </label>
        </div>

        <div style="margin-top:8px; opacity:.9;">
          Комерційні: <b>${e.commercial}</b> |
          Лотки: <b>${trays}</b> |
          Залишок: <b>${remainder}</b>
        </div>

        <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
          <button onclick="saveEditedEgg('${d}')">💾 Зберегти правки</button>
          <button onclick="deleteEggDay('${d}')">🗑️ Видалити день</button>
        </div>
      </div>
    `;
  });

  html = `
    <div style="margin-bottom:12px;">
      <button onclick="deleteAllEggs()">🧨 Видалити весь щоденний звіт</button>
    </div>
  ` + html;

  list.innerHTML = html;
}

// Зберегти правки одного дня
function saveEditedEgg(date) {
  const inputs = document.querySelectorAll(`.egg-edit[data-date="${date}"]`);
  if (!inputs.length) return;

  const upd = { good: 0, bad: 0, home: 0 };
  inputs.forEach((inp) => {
    const field = inp.dataset.field;
    upd[field] = Number(inp.value) || 0;
  });

  eggs[date] = { good: upd.good, bad: upd.bad, home: upd.home };
  localStorage.setItem("eggs", JSON.stringify(eggs));

  recalcEggTotalsToWarehouse();
  updateEggsInfoBox();
  renderEggsReport();
}

// Видалити один день
function deleteEggDay(date) {
  if (!confirm(`Видалити запис за ${date}?`)) return;
  delete eggs[date];
  localStorage.setItem("eggs", JSON.stringify(eggs));

  recalcEggTotalsToWarehouse();
  updateEggsInfoBox();
  renderEggsReport();
}

// Видалити весь звіт
function deleteAllEggs() {
  if (!confirm("Точно видалити ВЕСЬ щоденний звіт по яйцях?")) return;

  eggs = {};
  localStorage.setItem("eggs", JSON.stringify(eggs));

  // логічно скинути вироблені лотки і залишок,
  // а delivered залишаємо як є? — НІ, краще скинути, щоб не було мінусів.
  warehouse.producedTrays = 0;
  warehouse.eggRemainder = 0;
  warehouse.delivered = 0;

  // ready перераховується
  warehouse.ready = 0;

  saveWarehouse();
  renderWarehouse();
  showOrders();
  updateEggsInfoBox();
  renderEggsReport();
}

// ініціалізація вкладки Яйця
recalcEggTotalsToWarehouse();
updateEggsInfoBox();
renderEggsReport();

// ============================
//      ЗАМОВЛЕННЯ (резерв/виконано/скасовано)
// ============================
let orders = JSON.parse(localStorage.getItem("orders") || "{}");

function persistOrders() {
  localStorage.setItem("orders", JSON.stringify(orders));
}

// Перерахунок резерву з замовлень (щоб не “з’їхало”)
function recalcReservedFromOrders() {
  let reserved = 0;

  Object.keys(orders).forEach((d) => {
    orders[d].forEach((o) => {
      if (o.status === "активне") reserved += Number(o.trays) || 0;
    });
  });

  warehouse.reserved = reserved;
  saveWarehouse();

  // оновити ready після зміни резерву не треба (ready = produced - delivered),
  // але UI треба освіжити
  renderWarehouse();
}

// Додавання замовлення (можна навіть якщо готових 0)
function addOrder() {
  const d = document.getElementById("orderDate")?.value || new Date().toISOString().slice(0, 10);
  const trays = Number(document.getElementById("orderTrays")?.value) || 0;

  if (trays <= 0) {
    alert("Вкажи кількість лотків");
    return;
  }

  if (!orders[d]) orders[d] = [];
  orders[d].push({
    name: document.getElementById("orderName")?.value || "Без імені",
    trays,
    details: document.getElementById("orderDetails")?.value || "",
    status: "активне",
  });

  persistOrders();
  recalcReservedFromOrders();
  showOrders();
}

function setStatus(d, i, s) {
  const o = orders?.[d]?.[i];
  if (!o) return;

  const trays = Number(o.trays) || 0;
  const old = o.status;

  if (old === s) return;

  // якщо було активне:
  if (old === "активне" && s === "виконано") {
    warehouse.delivered = (warehouse.delivered || 0) + trays;
  }

  // якщо було виконано і переводимо назад в активне (на всяк)
  if (old === "виконано" && s === "активне") {
    warehouse.delivered = Math.max((warehouse.delivered || 0) - trays, 0);
  }

  o.status = s;

  persistOrders();
  saveWarehouse();

  // перерахувати produced/ready по яйцях не треба, але ready залежить від delivered
  warehouse.ready = Math.max((warehouse.producedTrays || 0) - (warehouse.delivered || 0), 0);

  recalcReservedFromOrders();
  showOrders();
  renderWarehouse();
}

function showOrders() {
  const box = document.getElementById("ordersList");
  if (!box) return;

  // актуалізуємо резерв
  recalcReservedFromOrders();

  const free = Math.max((warehouse.ready || 0) - (warehouse.reserved || 0), 0);

  let html = `
    <div class="orders-summary" style="margin: 10px; padding: 12px; border: 1px solid #222; border-radius: 10px; background:#131313;">
      <b>Вільні лотки:</b> ${free} |
      <b>Замовлено:</b> ${warehouse.reserved} |
      <b>Готових на складі:</b> ${warehouse.ready}
    </div>
  `;

  const dates = Object.keys(orders).sort().reverse();
  if (!dates.length) {
    box.innerHTML = html + "<i style='margin-left:10px;'>Замовлень немає</i>";
    return;
  }

  dates.forEach((d) => {
    html += `<h3 style="margin-left:10px;">${d}</h3>`;
    orders[d].forEach((o, i) => {
      html += `
        <div style="background:#131313; margin:10px; padding:12px; border-radius:10px; border:1px solid #222;">
          <b>${o.name}</b> — ${o.trays} лотків (<b>${o.status}</b>)<br>
          ${o.details ? `<div style="opacity:.9; margin-top:6px;">${o.details}</div>` : ""}
          <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
            <button onclick="setStatus('${d}',${i},'виконано')">✅ Виконано</button>
            <button onclick="setStatus('${d}',${i},'скасовано')">❌ Скасовано</button>
            <button onclick="setStatus('${d}',${i},'активне')">↩️ Активне</button>
          </div>
        </div>
      `;
    });
  });

  box.innerHTML = html;
}

showOrders();

// ============================
//      ЕКСПОРТ CSV (фінанси)
// ============================
function exportCSV() {
  let rows = ["Дата,Імʼя,Лотки,Деталі,Статус"];
  Object.keys(orders).forEach((d) => {
    orders[d].forEach((o) => {
      rows.push(`${d},${o.name},${o.trays},${(o.details || "").replaceAll(",", " ")},${o.status}`);
    });
  });

  let csv = rows.join("\n");
  let blob = new Blob([csv], { type: "text/csv" });
  let a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "orders.csv";
  a.click();
}

// ============================
//      ФІНАНСИ (якщо треба)
// ============================
function saveFinanceSettings() {
  const trayPriceEl = document.getElementById("trayPrice");
  if (!trayPriceEl) return;
  localStorage.setItem("trayPrice", trayPriceEl.value);
  showFinance();
}

function showFinance() {
  const trayPriceEl = document.getElementById("trayPrice");
  const reportEl = document.getElementById("financeReport");
  if (!trayPriceEl || !reportEl) return;

  let price = Number(localStorage.getItem("trayPrice") || 50);
  trayPriceEl.value = price;

  let income = 0;
  Object.keys(orders).forEach((d) => {
    orders[d].forEach((o) => {
      if (o.status === "виконано") income += (Number(o.trays) || 0) * price;
    });
  });

  reportEl.innerHTML = `<b>Дохід:</b> ${income} грн`;
}
showFinance();