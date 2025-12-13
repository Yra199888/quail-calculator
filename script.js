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
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const page = btn.dataset.page;
    if (!page) return;

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
    const target = document.getElementById("page-" + page);
    if (target) target.classList.add("active-page");

    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
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
  ["Сіль", 0.05]
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

  document.querySelectorAll(".qty, .price, #feedVolume")
    .forEach(el => el.addEventListener("input", calculateFeed));
}

function calculateFeed() {
  let total = 0;
  let totalKg = 0;

  feedComponents.forEach((item, i) => {
    const qty = Number(document.querySelector(`.qty[data-i="${i}"]`)?.value) || 0;
    const price = Number(document.querySelector(`.price[data-i="${i}"]`)?.value) || 0;

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
//      СКЛАД (корм + лотки-порожні)
// ============================
let warehouse = JSON.parse(localStorage.getItem("warehouse") || "{}");
if (!warehouse.feed) {
  warehouse = {
    feed: {},
    trays: 0,      // порожні лотки (вводиш вручну)
    history: []    // історія замісів
  };
  saveWarehouse();
}

function saveWarehouse() {
  localStorage.setItem("warehouse", JSON.stringify(warehouse));
}

// ============================
//      ЯЙЦЯ + ПЕРЕНОС (ключове)
// ============================
let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");

// Фікс: завжди тримаємо об'єкт
if (!eggs || typeof eggs !== "object") eggs = {};

function getSortedEggDatesAsc() {
  return Object.keys(eggs).sort((a, b) => a.localeCompare(b));
}

// Перерахунок ВСІХ днів з переносом залишку
function recomputeEggs() {
  const dates = getSortedEggDatesAsc();

  let carry = 0; // перенос яєць (залишок) з попереднього дня
  let producedTrays = 0;

  dates.forEach(d => {
    const e = eggs[d] || {};
    const good = Number(e.good) || 0;
    const bad = Number(e.bad) || 0;
    const home = Number(e.home) || 0;

    const commercial = Math.max(good - bad - home, 0);
    const totalEggs = carry + commercial;

    const traysMade = Math.floor(totalEggs / 20);
    const remainder = totalEggs % 20;

    // зберігаємо калькуляцію, щоб показувати в звіті
    eggs[d] = {
      good, bad, home,
      commercial,
      carryIn: carry,
      totalEggs,
      traysMade,
      remainder
    };

    producedTrays += traysMade;
    carry = remainder;
  });

  localStorage.setItem("eggs", JSON.stringify(eggs));
  return { producedTrays, lastRemainder: carry };
}

// ============================
//      ЗАМОВЛЕННЯ (резерв/виконано)
// ============================
let orders = JSON.parse(localStorage.getItem("orders") || "{}");
if (!orders || typeof orders !== "object") orders = {};

function saveOrders() {
  localStorage.setItem("orders", JSON.stringify(orders));
}

function computeOrderStats() {
  let reserved = 0;
  let delivered = 0;

  Object.keys(orders).forEach(date => {
    (orders[date] || []).forEach(o => {
      const trays = Number(o.trays) || 0;
      if (o.status === "активне") reserved += trays;
      if (o.status === "виконано") delivered += trays;
    });
  });

  return { reserved, delivered };
}

// ============================
//      ПОКАЗНИКИ ЛОТКІВ (всюди однаково)
// ============================
function computeTraysState() {
  const eggStats = recomputeEggs(); // вироблено з яєць
  const orderStats = computeOrderStats(); // резерв/виконано

  const ready = Math.max(eggStats.producedTrays - orderStats.delivered, 0); // реально на складі (після виконаних)
  const free = Math.max(ready - orderStats.reserved, 0);                    // вільні (не заброньовані)

  return {
    producedTrays: eggStats.producedTrays,
    ready,
    reserved: orderStats.reserved,
    delivered: orderStats.delivered,
    free,
    lastRemainder: eggStats.lastRemainder
  };
}

// ============================
//      СКЛАД: таблиця корму + лотки
// ============================
function renderWarehouse() {
  const tbody = document.getElementById("warehouseTable");
  if (!tbody) return;

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
      </tr>`;
  });

  tbody.innerHTML = html;

  document.querySelectorAll(".addStock").forEach(inp => {
    inp.addEventListener("change", e => {
      const name = e.target.dataset.name;
      const val = Number(e.target.value) || 0;
      if (val > 0) {
        warehouse.feed[name] = (warehouse.feed[name] || 0) + val;
        saveWarehouse();
        renderWarehouse();
      }
    });
  });

  const trayStock = document.getElementById("trayStock");
  if (trayStock) {
    trayStock.value = Number(warehouse.trays) || 0;
    trayStock.onchange = (e) => {
      warehouse.trays = Number(e.target.value) || 0;
      saveWarehouse();
    };
  }

  // ПОВНІ/ЗАБРОНЬОВАНІ — рахуємо стабільно
  const t = computeTraysState();
  const fullTrays = document.getElementById("fullTrays");
  const reservedTrays = document.getElementById("reservedTrays");
  if (fullTrays) fullTrays.textContent = t.ready;
  if (reservedTrays) reservedTrays.textContent = t.reserved;

  // історія замісів (якщо є елемент)
  const mixHistory = document.getElementById("mixHistory");
  if (mixHistory) {
    if (!warehouse.history || warehouse.history.length === 0) {
      mixHistory.innerHTML = "<i>Порожньо</i>";
    } else {
      mixHistory.innerHTML = "<ul>" + warehouse.history.map(x => `<li>${x}</li>`).join("") + "</ul>";
    }
  }
}

renderWarehouse();

// кнопка "Зробити корм"
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

    feedComponents.forEach(item => {
      warehouse.feed[item[0]] -= item[1];
    });

    warehouse.history = warehouse.history || [];
    warehouse.history.push("Заміс: " + new Date().toLocaleString());

    saveWarehouse();
    renderWarehouse();
  });
}

// ============================
//      ЯЙЦЯ: збереження/редагування/видалення
// ============================
let editingEggDate = null;

function setEggFormValues(date, good, bad, home) {
  const d = document.getElementById("eggsDate");
  const g = document.getElementById("eggsGood");
  const b = document.getElementById("eggsBad");
  const h = document.getElementById("eggsHome");

  if (d) d.value = date || "";
  if (g) g.value = good ?? "";
  if (b) b.value = bad ?? "";
  if (h) h.value = home ?? "";
}

function updateEggInfoBox() {
  const info = document.getElementById("eggsInfo");
  if (!info) return;

  const t = computeTraysState();
  info.innerHTML = `📦 <b>Вільні лотки:</b> ${t.free} | <b>Заброньовано:</b> ${t.reserved} | <b>Готові:</b> ${t.ready} | <b>Залишок яєць:</b> ${t.lastRemainder}`;
}

// Головна кнопка "Зберегти"
function saveEggRecord() {
  const eggsDate = document.getElementById("eggsDate");
  const eggsGood = document.getElementById("eggsGood");
  const eggsBad  = document.getElementById("eggsBad");
  const eggsHome = document.getElementById("eggsHome");

  if (!eggsDate || !eggsGood || !eggsBad || !eggsHome) return;

  const date = eggsDate.value || new Date().toISOString().slice(0, 10);
  const good = Number(eggsGood.value) || 0;
  const bad  = Number(eggsBad.value) || 0;
  const home = Number(eggsHome.value) || 0;

  // записуємо ТІЛЬКИ введені значення — перенос/лотки рахуємо через recomputeEggs()
  eggs[date] = { good, bad, home };

  localStorage.setItem("eggs", JSON.stringify(eggs));
  editingEggDate = null;

  renderEggsReport();
  updateEggInfoBox();
  renderWarehouse();
}

// Рендер щоденного звіту (з переносом)
function renderEggsReport() {
  const list = document.getElementById("eggsList");
  if (!list) return;

  const t = recomputeEggs(); // оновлює eggs[*] з carryIn/traysMade/remainder
  (void)t;

  const datesDesc = Object.keys(eggs).sort().reverse();
  if (datesDesc.length === 0) {
    list.innerHTML = "<i>Записів немає</i>";
    updateEggInfoBox();
    return;
  }

  let html = "";
  datesDesc.forEach(d => {
    const e = eggs[d];

    html += `
      <div class="egg-entry" style="background:#131313; border:1px solid #222; border-radius:12px; padding:12px; margin:10px 0;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
          <div>
            <b>${d}</b><br>
            Всього: ${e.good} | Брак: ${e.bad} | Для дому: ${e.home}<br>
            Комерційні: ${e.commercial}<br>
            Перенос з учора: ${e.carryIn} → Разом: ${e.totalEggs}<br>
            Лотки: <b>${e.traysMade}</b> | Залишок: <b>${e.remainder}</b>
          </div>
          <div style="display:flex; gap:8px;">
            <button onclick="editEgg('${d}')" style="padding:8px 10px; border-radius:10px; border:none;">✏️</button>
            <button onclick="deleteEgg('${d}')" style="padding:8px 10px; border-radius:10px; border:none;">🗑️</button>
          </div>
        </div>
      </div>`;
  });

  list.innerHTML = html;
  updateEggInfoBox();
}

// редагувати день
function editEgg(date) {
  const e = eggs[date];
  if (!e) return;

  // якщо це вже перераховані поля — беремо базові good/bad/home
  setEggFormValues(date, e.good, e.bad, e.home);
  editingEggDate = date;

  const info = document.getElementById("eggsInfo");
  if (info) info.innerHTML = `✏️ Редагування запису за <b>${date}</b>`;
}

// видалити один день
function deleteEgg(date) {
  if (!confirm(`Видалити запис за ${date}?`)) return;
  delete eggs[date];
  localStorage.setItem("eggs", JSON.stringify(eggs));
  renderEggsReport();
  updateEggInfoBox();
  renderWarehouse();
}

// видалити весь щоденний звіт
function clearAllEggs() {
  if (!confirm("Точно видалити ВЕСЬ щоденний звіт по яйцях?")) return;
  eggs = {};
  localStorage.setItem("eggs", JSON.stringify(eggs));
  renderEggsReport();
  updateEggInfoBox();
  renderWarehouse();
}

// робимо функції доступними для onclick=""
window.saveEggRecord = saveEggRecord;
window.editEgg = editEgg;
window.deleteEgg = deleteEgg;
window.clearAllEggs = clearAllEggs;

renderEggsReport();
updateEggInfoBox();

// ============================
//      ЗАМОВЛЕННЯ
// ============================
function addOrder() {
  const orderDate = document.getElementById("orderDate");
  const orderName = document.getElementById("orderName");
  const orderTrays = document.getElementById("orderTrays");
  const orderDetails = document.getElementById("orderDetails");

  const d = (orderDate?.value) || new Date().toISOString().slice(0, 10);
  const trays = Number(orderTrays?.value) || 0;

  if (!orders[d]) orders[d] = [];
  orders[d].push({
    name: orderName?.value || "Без імені",
    trays,
    details: orderDetails?.value || "",
    status: "активне"
  });

  saveOrders();
  showOrders();
  updateEggInfoBox();
  renderWarehouse();
}

function setStatus(d, i, s) {
  const o = orders[d]?.[i];
  if (!o) return;

  o.status = s;
  saveOrders();
  showOrders();
  updateEggInfoBox();
  renderWarehouse();
}

function showOrders() {
  const box = document.getElementById("ordersList");
  if (!box) return;

  const t = computeTraysState();

  let html = `
    <div style="background:#131313; border:1px solid #222; border-radius:12px; padding:10px; margin:10px 0;">
      <b>Вільні лотки:</b> ${t.free} |
      <b>Замовлено:</b> ${t.reserved} |
      <b>Готові:</b> ${t.ready}
    </div>
  `;

  const dates = Object.keys(orders).sort().reverse();
  dates.forEach(d => {
    html += `<h3>${d}</h3>`;
    (orders[d] || []).forEach((o, i) => {
      html += `
        <div style="background:#131313; border:1px solid #222; border-radius:12px; padding:12px; margin:10px 0;">
          <b>${o.name}</b> — ${o.trays} лотків (<b>${o.status}</b>)<br>
          ${o.details ? o.details + "<br>" : ""}
          <button onclick="setStatus('${d}',${i},'виконано')" style="margin-top:8px; padding:8px 10px; border-radius:10px; border:none;">✅ Виконано</button>
          <button onclick="setStatus('${d}',${i},'скасовано')" style="margin-top:8px; padding:8px 10px; border-radius:10px; border:none;">❌ Скасовано</button>
          <button onclick="setStatus('${d}',${i},'активне')" style="margin-top:8px; padding:8px 10px; border-radius:10px; border:none;">↩️ Активне</button>
        </div>
      `;
    });
  });

  box.innerHTML = html;
}

window.addOrder = addOrder;
window.setStatus = setStatus;

showOrders();