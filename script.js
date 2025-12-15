// ============================
//      ДОПОМІЖНІ
// ============================
const $ = (id) => document.getElementById(id);

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function sortDatesAsc(dates) {
  return dates.slice().sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

// ============================
//      ГЛОБАЛЬНІ ПЕРЕМИКАЧІ (ЗАХИСТ)
// зелена = ВИМКНЕНО, червона = УВІМКНЕНО
// ============================
let eggsEditEnabled = false;
let warehouseEditEnabled = false;

function paintToggleButton(btn, enabled, label) {
  if (!btn) return;
  btn.textContent = `${enabled ? "🔓" : "🔒"} ${label}: ${enabled ? "УВІМКНЕНО" : "ВИМКНЕНО"}`;
  btn.style.background = enabled ? "#b30000" : "#2e7d32"; // червоний / зелений
  btn.style.color = "#fff";
}

// Підв’язка кнопок toggle після завантаження DOM
function syncToggleButtonsUI() {
  // eggs toggle button (у тебе в index без id, тому шукаємо по onclick)
  const eggsBtn = document.querySelector(`button[onclick="toggleEggsEdit()"]`);
  const whBtn   = document.querySelector(`button[onclick="toggleWarehouseEdit()"]`);

  paintToggleButton(eggsBtn, eggsEditEnabled, "Редагування яєць");
  paintToggleButton(whBtn, warehouseEditEnabled, "Редагування складу");
}

// ============================
//      ТЕМА (ніч / день)
// ============================
const themeSwitch = $("themeSwitch");
if (themeSwitch) {
  themeSwitch.onclick = () => {
    document.body.classList.toggle("light");
    themeSwitch.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
  };
}

// ============================
//      НАВІГАЦІЯ
// ============================
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.onclick = () => {
    const page = btn.dataset.page;
    if (!page) return; // тема

    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active-page"));
    $("page-" + page)?.classList.add("active-page");

    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  };
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
//      КАЛЬКУЛЯТОР КОРМУ (ЛОГІКУ НЕ ЛАМАЄМО)
// ============================
function loadFeedTable() {
  const tbody = $("feedTable");
  if (!tbody) return;

  tbody.innerHTML = feedComponents
    .map(
      (c, i) => `
    <tr>
      <td>${c[0]}</td>
      <td><input class="qty" data-i="${i}" type="number" value="${localStorage.getItem("qty_" + i) ?? c[1]}"></td>
      <td><input class="price" data-i="${i}" type="number" value="${localStorage.getItem("price_" + i) ?? 0}"></td>
      <td id="sum_${i}">0</td>
    </tr>
  `
    )
    .join("");

  document.querySelectorAll(".qty,.price,#feedVolume").forEach((el) => (el.oninput = calculateFeed));
  calculateFeed();
}

function calculateFeed() {
  let total = 0,
    totalKg = 0;

  feedComponents.forEach((_, i) => {
    const qty = Number(document.querySelector(`.qty[data-i="${i}"]`)?.value) || 0;
    const price = Number(document.querySelector(`.price[data-i="${i}"]`)?.value) || 0;

    localStorage.setItem("qty_" + i, qty);
    localStorage.setItem("price_" + i, price);

    const sum = qty * price;
    total += sum;
    totalKg += qty;

    const cell = $("sum_" + i);
    if (cell) cell.textContent = sum.toFixed(2);
  });

  const perKg = totalKg ? total / totalKg : 0;
  const vol = Number($("feedVolume")?.value) || 0;

  if ($("feedTotal")) $("feedTotal").textContent = total.toFixed(2);
  if ($("feedPerKg")) $("feedPerKg").textContent = perKg.toFixed(2);
  if ($("feedVolumeTotal")) $("feedVolumeTotal").textContent = (perKg * vol).toFixed(2);
}

loadFeedTable();

// ============================
//      СКЛАД
// ============================
let warehouse = JSON.parse(localStorage.getItem("warehouse") || "{}");
if (!warehouse.feed) {
  warehouse = {
    feed: {},
    trays: 0, // пусті лотки (ручне поле)
    ready: 0, // готові повні лотки
    reserved: 0, // заброньовані
    history: [],
  };
  saveWarehouse();
}

function saveWarehouse() {
  localStorage.setItem("warehouse", JSON.stringify(warehouse));
}

function renderWarehouse() {
  const tbody = $("warehouseTable");
  if (!tbody) return;

  tbody.innerHTML = feedComponents
    .map((item) => {
      const name = item[0];
      const need = item[1];
      const stock = warehouse.feed[name] || 0;

      return `
      <tr>
        <td>${name}</td>
        <td><input class="addStock" data-name="${name}" type="number" value="0"></td>
        <td>${need}</td>
        <td>${stock.toFixed(2)}</td>
      </tr>
    `;
    })
    .join("");

  // додавання приходу — тільки якщо увімкнули редагування складу
  document.querySelectorAll(".addStock").forEach((inp) => {
    inp.onchange = (e) => {
      const val = Number(e.target.value) || 0;
      e.target.value = 0;

      if (val <= 0) return;

      if (!warehouseEditEnabled) {
        alert("🔒 Спочатку увімкни редагування складу");
        return;
      }

      const name = e.target.dataset.name;
      warehouse.feed[name] = (warehouse.feed[name] || 0) + val;
      saveWarehouse();
      renderWarehouse();
    };
  });

  // пусті лотки — теж тільки при увімкненому редагуванні складу
  const trayStockEl = $("trayStock");
  if (trayStockEl) {
    trayStockEl.value = warehouse.trays ?? 0;
    trayStockEl.onchange = (e) => {
      if (!warehouseEditEnabled) {
        alert("🔒 Спочатку увімкни редагування складу");
        trayStockEl.value = warehouse.trays ?? 0;
        return;
      }
      warehouse.trays = Number(e.target.value) || 0;
      saveWarehouse();
    };
  }

  if ($("fullTrays")) $("fullTrays").textContent = warehouse.ready ?? 0;
  if ($("reservedTrays")) $("reservedTrays").textContent = warehouse.reserved ?? 0;

  const mixHistory = $("mixHistory");
  if (mixHistory) {
    mixHistory.innerHTML =
      warehouse.history?.length
        ? "<ul>" + warehouse.history.map((x) => `<li>${x}</li>`).join("") + "</ul>"
        : "<i>Порожньо</i>";
  }
}

renderWarehouse();

// кнопка "Зробити корм"
const makeFeedBtn = $("makeFeedBtn");
if (makeFeedBtn) {
  makeFeedBtn.onclick = () => {
    // перевірка наявності компонентів
    for (const item of feedComponents) {
      const name = item[0];
      const need = item[1];
      if ((warehouse.feed[name] || 0) < need) {
        alert(`Недостатньо компоненту: ${name}`);
        return;
      }
    }

    // списання
    feedComponents.forEach((item) => {
      const name = item[0];
      const need = item[1];
      warehouse.feed[name] -= need;
    });

    warehouse.history.push("Заміс: " + new Date().toLocaleString());
    saveWarehouse();
    renderWarehouse();
  };
}

// ============================
//      ЯЙЦЯ — накопичення + перенос + синхрон з лотками
// ============================
let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");

// eggsCarry: carry (яйця на залишку), totalTrays (всього лотків вироблено),
// appliedTotalTrays (скільки вже додано в warehouse.ready, щоб не дублювало після перезавантаження)
let eggsCarry = JSON.parse(localStorage.getItem("eggsCarry") || "{}");
if (typeof eggsCarry.carry !== "number") eggsCarry.carry = 0;
if (typeof eggsCarry.totalTrays !== "number") eggsCarry.totalTrays = 0;
if (typeof eggsCarry.appliedTotalTrays !== "number") eggsCarry.appliedTotalTrays = 0;

function recomputeEggsAccumulation() {
  const dates = sortDatesAsc(Object.keys(eggs));
  let carry = 0;
  let totalTrays = 0;

  dates.forEach((d) => {
    const e = eggs[d];
    const good = Number(e.good) || 0;
    const bad = Number(e.bad) || 0;
    const home = Number(e.home) || 0;

    const commercial = Math.max(good - bad - home, 0);
    const sum = carry + commercial;

    const trays = Math.floor(sum / 20);
    const remainder = sum % 20;

    e.commercial = commercial;
    e.carryIn = carry;
    e.sum = sum;
    e.trays = trays;
    e.remainder = remainder;

    totalTrays += trays;
    carry = remainder;
  });

  eggsCarry.carry = carry;
  eggsCarry.totalTrays = totalTrays;

  // ✅ синхронізація готових лотків через ДЕЛЬТУ (щоб не дублювало при F5)
  const delta = eggsCarry.totalTrays - eggsCarry.appliedTotalTrays;
  if (delta !== 0) {
    const minReady = Math.max(warehouse.reserved || 0, 0);
    warehouse.ready = Math.max((warehouse.ready || 0) + delta, minReady);
    eggsCarry.appliedTotalTrays = eggsCarry.totalTrays;

    saveWarehouse();
    renderWarehouse();
    showOrders();
  }

  localStorage.setItem("eggs", JSON.stringify(eggs));
  localStorage.setItem("eggsCarry", JSON.stringify(eggsCarry));
}

function saveEggRecord() {
  const dateInput = $("eggsDate");
  const goodInput = $("eggsGood");
  const badInput = $("eggsBad");
  const homeInput = $("eggsHome");
  const infoBox = $("eggsInfo");

  if (!dateInput || !goodInput || !badInput || !homeInput) return;

  const date = dateInput.value || isoToday();

  eggs[date] = {
    good: Number(goodInput.value) || 0,
    bad: Number(badInput.value) || 0,
    home: Number(homeInput.value) || 0,
  };

  recomputeEggsAccumulation();

  const e = eggs[date];
  if (infoBox && e) {
    if ((e.sum || 0) < 20) {
      infoBox.innerHTML = `🥚 ${e.sum} яєць (до лотка бракує ${20 - e.sum})`;
    } else {
      infoBox.innerHTML = `📦 Повних лотків: <b>${e.trays}</b>, залишок <b>${e.remainder}</b> яєць`;
    }
  }

  renderEggsReport();
}
window.saveEggRecord = saveEggRecord;

function editEgg(date) {
  const e = eggs[date];
  if (!e) return;

  $("eggsDate").value = date;
  $("eggsGood").value = e.good ?? 0;
  $("eggsBad").value = e.bad ?? 0;
  $("eggsHome").value = e.home ?? 0;
}
window.editEgg = editEgg;

function deleteEgg(date) {
  if (!eggsEditEnabled) {
    alert("🔒 Увімкни редагування яєць");
    return;
  }
  if (!eggs[date]) return;

  if (!confirm(`Видалити запис за ${date}?`)) return;

  delete eggs[date];
  recomputeEggsAccumulation();
  renderEggsReport();
}
window.deleteEgg = deleteEgg;

function clearAllEggs() {
  if (!eggsEditEnabled) {
    alert("🔒 Увімкни редагування яєць");
    return;
  }

  if (!confirm("Видалити ВЕСЬ щоденний звіт по яйцях?")) return;

  eggs = {};
  eggsCarry = {
    carry: 0,
    totalTrays: 0,
    appliedTotalTrays: eggsCarry.appliedTotalTrays || 0,
  };

  localStorage.setItem("eggs", JSON.stringify(eggs));
  localStorage.setItem("eggsCarry", JSON.stringify(eggsCarry));

  // перерахунок дасть дельту і зніме лотки з warehouse.ready (але не нижче reserved)
  recomputeEggsAccumulation();
  renderEggsReport();

  if ($("eggsInfo")) $("eggsInfo").innerHTML = "";

  alert("✅ Звіт по яйцях очищено");
}
window.clearAllEggs = clearAllEggs;

function renderEggsReport() {
  const list = $("eggsList");
  if (!list) return;

  const dates = Object.keys(eggs).sort().reverse();
  if (!dates.length) {
    list.innerHTML = "<i>Записів немає</i>";
    return;
  }

  list.innerHTML = dates
    .map((d) => {
      const e = eggs[d];
      return `
      <div class="egg-entry">
        <div style="display:flex; justify-content:space-between; gap:10px;">
          <b>${d}</b>
          <div style="display:flex; gap:8px;">
            <button onclick="editEgg('${d}')">✏️</button>
            <button onclick="deleteEgg('${d}')">🗑️</button>
          </div>
        </div>
        Всього: ${e.good} | Брак: ${e.bad} | Для дому: ${e.home}<br>
        Перенос: ${e.carryIn ?? 0} → Разом: ${e.sum ?? 0}<br>
        Лотки: <b>${e.trays ?? 0}</b> | Залишок: <b>${e.remainder ?? 0}</b>
      </div>
    `;
    })
    .join("");
}

recomputeEggsAccumulation();
renderEggsReport();

// ============================
//      ЗАМОВЛЕННЯ
// ============================
let orders = JSON.parse(localStorage.getItem("orders") || "{}");

function addOrder() {
  const d = $("orderDate")?.value || isoToday();
  const name = $("orderName")?.value || "Без імені";
  const trays = Number($("orderTrays")?.value) || 0;
  const details = $("orderDetails")?.value || "";

  if (trays <= 0) {
    alert("Вкажи кількість лотків (> 0)");
    return;
  }

  if (!orders[d]) orders[d] = [];
  orders[d].push({ name, trays, details, status: "активне" });

  warehouse.reserved = (warehouse.reserved || 0) + trays;
  saveWarehouse();
  localStorage.setItem("orders", JSON.stringify(orders));

  showOrders();
  renderWarehouse();
}
window.addOrder = addOrder;

function setStatus(d, i, s) {
  const o = orders[d]?.[i];
  if (!o) return;

  if (o.status === "активне") {
    if (s === "виконано") {
      warehouse.reserved = (warehouse.reserved || 0) - o.trays;
      warehouse.ready = Math.max((warehouse.ready || 0) - o.trays, warehouse.reserved || 0);
    }
    if (s === "скасовано") {
      warehouse.reserved = (warehouse.reserved || 0) - o.trays;
      warehouse.ready = Math.max(warehouse.ready || 0, warehouse.reserved || 0);
    }
  }

  o.status = s;
  saveWarehouse();
  localStorage.setItem("orders", JSON.stringify(orders));
  showOrders();
  renderWarehouse();
}
window.setStatus = setStatus;

function showOrders() {
  const box = $("ordersList");
  if (!box) return;

  const ready = warehouse.ready || 0;
  const reserved = warehouse.reserved || 0;
  const free = Math.max(ready - reserved, 0);

  let html = `
    <div style="background:#111; border:1px solid #222; padding:10px; border-radius:10px; margin:10px 0;">
      <b>Вільні лотки:</b> ${free} |
      <b>Замовлено:</b> ${reserved} |
      <b>Готові:</b> ${ready}
    </div>
  `;

  Object.keys(orders)
    .sort()
    .reverse()
    .forEach((date) => {
      html += `<h3>${date}</h3>`;
      orders[date].forEach((o, idx) => {
        html += `
        <div style="background:#131313; border:1px solid #222; padding:12px; border-radius:10px; margin:10px 0;">
          <b>${o.name}</b> — ${o.trays} лотків (<b>${o.status}</b>)<br>
          ${o.details ? o.details + "<br>" : ""}
          <button onclick="setStatus('${date}',${idx},'виконано')">✅ Виконано</button>
          <button onclick="setStatus('${date}',${idx},'скасовано')">❌ Скасовано</button>
        </div>
      `;
      });
    });

  box.innerHTML = html;
}
showOrders();

// ============================
//      ФІНАНСИ (заглушки)
// ============================
function saveFinanceSettings() {
  alert("Фінанси: ще в розробці 🙂");
}
function exportCSV() {
  alert("Експорт: ще в розробці 🙂");
}
window.saveFinanceSettings = saveFinanceSettings;
window.exportCSV = exportCSV;

// ============================
//      TOGGLE (ЯЙЦЯ / СКЛАД) + КНОПКИ
// ============================
function toggleEggsEdit() {
  eggsEditEnabled = !eggsEditEnabled;
  syncToggleButtonsUI();
  alert(eggsEditEnabled ? "🔓 Редагування яєць УВІМКНЕНО" : "🔒 Редагування яєць ВИМКНЕНО");
}
window.toggleEggsEdit = toggleEggsEdit;

function toggleWarehouseEdit() {
  warehouseEditEnabled = !warehouseEditEnabled;
  syncToggleButtonsUI();
  alert(warehouseEditEnabled ? "🔓 Редагування складу УВІМКНЕНО" : "🔒 Редагування складу ВИМКНЕНО");
}
window.toggleWarehouseEdit = toggleWarehouseEdit;

// ============================
//   ОЧИСТКА СКЛАДУ / ЛОТКІВ
// ============================

// Очистити ВСІ кормові компоненти
function clearFeedComponents() {
  if (!warehouseEditEnabled) {
    alert("🔒 Спочатку увімкни редагування складу");
    return;
  }
  if (!confirm("Очистити ВСІ кормові компоненти на складі?")) return;

  warehouse.feed = {};
  saveWarehouse();
  renderWarehouse();

  alert("✅ Компоненти складу очищено");
}
window.clearFeedComponents = clearFeedComponents;

// Очистити лотки з яйцями (готові + резерв)
function clearEggTrays() {
  if (!eggsEditEnabled) {
    alert("🔒 Спочатку увімкни редагування яєць");
    return;
  }
  if (!confirm("Очистити ВСІ лотки з яйцями? (готові + резерв)")) return;

  warehouse.ready = 0;
  warehouse.reserved = 0;

  // також важливо обнулити “applied”, щоб подальший перерахунок яєць не “повернув” лотки
  eggsCarry.appliedTotalTrays = eggsCarry.totalTrays;

  localStorage.setItem("eggsCarry", JSON.stringify(eggsCarry));
  saveWarehouse();
  renderWarehouse();
  showOrders();

  alert("✅ Лотки з яйцями очищено");
}
window.clearEggTrays = clearEggTrays;

function feedKey(name) {
  return name.replace(/\s+/g, "_").toUpperCase();
}

// ============================
//  НАЛАШТУВАННЯ СКЛАДУ — МІНІМУМИ
// ============================

let warehouseMinimums = JSON.parse(
  localStorage.getItem("warehouseMinimums") || "{}"
);

function saveWarehouseMinimum(key, value) {
  warehouseMinimums[key] = Number(value) || 0;
  localStorage.setItem(
    "warehouseMinimums",
    JSON.stringify(warehouseMinimums)
  );
}

// ============================
//  НАЛАШТУВАННЯ СКЛАДУ — МІНІМУМИ
// ============================

// ключі компонентів (ВАЖЛИВО: ті самі, що в index)
const FEED_KEYS = {
  "Кукурудза": "KUKURYDZA",
  "Пшениця": "PSHENYCYA",
  "Ячмінь": "YACHMIN",
  "Соева макуха": "SOYA",
  "Соняшникова макуха": "SONяшNYK",
  "Рибне борошно": "RYBNE",
  "Дріжджі": "DRIZHDZHI",
  "Трикальційфосфат": "TCP",
  "Dolfos D": "DOLFOS",
  "Сіль": "SIL"
};

// зчитування або створення
let warehouseMinimums = JSON.parse(
  localStorage.getItem("warehouseMinimums") || "{}"
);

// зберегти один мінімум
function saveWarehouseMinimum(key, value) {
  warehouseMinimums[key] = Number(value) || 0;
  localStorage.setItem(
    "warehouseMinimums",
    JSON.stringify(warehouseMinimums)
  );
}

// отримати мінімум
function getWarehouseMinimum(key) {
  return Number(warehouseMinimums[key]) || 0;
}

// ============================
//  ЗБЕРЕГТИ ВСІ НАЛАШТУВАННЯ
// ============================
function saveWarehouseSettings() {

  feedComponents.forEach(item => {
    const name = item[0];
    const key = FEED_KEYS[name];
    const input = document.getElementById("minFeed_" + key);

    if (input) {
      saveWarehouseMinimum(key, input.value);
    }
  });

  const emptyTraysInput = document.getElementById("minEmptyTrays");
  if (emptyTraysInput) {
    saveWarehouseMinimum("EMPTY_TRAYS", emptyTraysInput.value);
  }

  alert("✅ Мінімальні залишки складу збережено");
}
window.saveWarehouseSettings = saveWarehouseSettings;

// ============================
//  ЗАВАНТАЖЕННЯ В UI
// ============================
function loadWarehouseSettingsUI() {

  feedComponents.forEach(item => {
    const name = item[0];
    const key = FEED_KEYS[name];
    const input = document.getElementById("minFeed_" + key);

    if (input) {
      input.value = getWarehouseMinimum(key);
    }
  });

  const emptyTraysInput = document.getElementById("minEmptyTrays");
  if (emptyTraysInput) {
    emptyTraysInput.value = getWarehouseMinimum("EMPTY_TRAYS");
  }
}

// запуск при старті
loadWarehouseSettingsUI();


// ============================
//      СТАРТ UI
// ============================
syncToggleButtonsUI();