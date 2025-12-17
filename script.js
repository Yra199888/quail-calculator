// ============================
//      ДОПОМІЖНІ
// ============================
const $ = (id) => document.getElementById(id);

window.onerror = function (msg, src, line, col) {
  alert("JS помилка: " + msg + "\nРядок: " + line + ":" + col);
};

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function sortDatesAsc(dates) {
  return dates.slice().sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

// ============================
//      APP STATE (BASE)
// ============================
const AppState = {
  ui: {
    page: "calculator",
    eggsEditEnabled: false,
    warehouseEditEnabled: false,
  },

  warehouse: {
    feed: {},
    trays: 0,
    ready: 0,
    reserved: 0,
    history: [],
    minimums: {}
  },

  eggs: {
    records: {},          // всі дні
    carry: 0,             // залишок яєць
    totalTrays: 0,        // всього лотків
    appliedTotalTrays: 0  // застосовано до складу
  },
  orders: {}
};

function loadAppState() {
  try {
    const saved = JSON.parse(localStorage.getItem("AppState"));
    if (saved && typeof saved === "object") {
      if (saved.ui) Object.assign(AppState.ui, saved.ui);
      if (saved.warehouse) Object.assign(AppState.warehouse, saved.warehouse);
      if (saved.eggs) Object.assign(AppState.eggs, saved.eggs); // 🔑 КРИТИЧНО
    }
  } catch (e) {
    console.warn("AppState load failed", e);
  }
}

function migrateWarehouseToAppState() {
  // якщо вже є в AppState — нічого не робимо
  if (AppState.warehouse.feed && Object.keys(AppState.warehouse.feed).length) return;

  try {
    const old = JSON.parse(localStorage.getItem("warehouse"));
    if (!old) return;

    AppState.warehouse.feed = old.feed || {};
    AppState.warehouse.trays = old.trays || 0;
    AppState.warehouse.ready = old.ready || 0;
    AppState.warehouse.reserved = old.reserved || 0;
    AppState.warehouse.history = old.history || [];

    saveAppState();

    console.log("✅ Warehouse мігровано в AppState");
  } catch (e) {
    console.warn("❌ Не вдалося мігрувати склад", e);
  }
}

function migrateEggsToAppState() {
  if (
  AppState.eggs.records &&
  Object.keys(AppState.eggs.records).length &&
  typeof AppState.eggs.totalTrays === "number"
) return;
  try {
    const oldEggs = JSON.parse(localStorage.getItem("eggs")) || {};
    const oldCarry = JSON.parse(localStorage.getItem("eggsCarry")) || {};

    AppState.eggs.records = oldEggs;
    AppState.eggs.carry = oldCarry.carry || 0;
    AppState.eggs.totalTrays = oldCarry.totalTrays || 0;
    AppState.eggs.appliedTotalTrays = oldCarry.appliedTotalTrays || 0;

    saveAppState();

    console.log("✅ Eggs мігровано в AppState");
  } catch (e) {
    console.warn("❌ Не вдалося мігрувати яйця", e);
  }
}

function migrateOrdersToAppState() {
  if (AppState.orders && Object.keys(AppState.orders).length) return;

  try {
    const old = JSON.parse(localStorage.getItem("orders")) || {};
    Object.keys(old).forEach(date => {
      if (Array.isArray(old[date])) {
        old[date] = old[date];
      } else {
        old[date] = [];
      }
    });

    AppState.orders = old;
    saveAppState();
    console.log("✅ Orders мігровано в AppState");
  } catch (e) {
    console.warn("❌ Orders migration failed", e);
  }
}

// для зручності (щоб старі функції не ламались)
let orders = {};

function normalizeOrdersObject(obj) {
  if (!obj || typeof obj !== "object") return {};

  Object.keys(obj).forEach((date) => {
    const v = obj[date];

    // якщо вже масив — ок
    if (Array.isArray(v)) return;

    // якщо це 1 замовлення обʼєктом — перетворюємо в масив з 1 елемента
    if (v && typeof v === "object" && ("trays" in v || "name" in v)) {
      obj[date] = [v];
      return;
    }

    // все інше — робимо порожній масив
    obj[date] = [];
  });

  return obj;
}

function loadOrders() {
  // ✅ головне джерело — AppState
  const fromState = AppState.orders && typeof AppState.orders === "object" ? AppState.orders : null;

  if (fromState) {
    AppState.orders = normalizeOrdersObject(fromState);
    orders = AppState.orders;
    saveAppState();
    return;
  }

  // fallback: старий localStorage
  try {
    const old = JSON.parse(localStorage.getItem("orders") || "{}") || {};
    AppState.orders = normalizeOrdersObject(old);
    orders = AppState.orders;
    saveAppState();
  } catch {
    AppState.orders = {};
    orders = AppState.orders;
    saveAppState();
  }
}


function saveAppState() {
  try {
    localStorage.setItem("AppState", JSON.stringify(AppState));
  } catch (e) {
    console.error("AppState save failed", e);
  }
}

// ============================
//      ГЛОБАЛЬНІ ПЕРЕМИКАЧІ (ЗАХИСТ)
// ============================
let eggsEditEnabled = false;
let warehouseEditEnabled = false;

function paintToggleButton(btn, enabled, label) {
  if (!btn) return;
  btn.textContent = `${enabled ? "🔓" : "🔒"} ${label}: ${enabled ? "УВІМКНЕНО" : "ВИМКНЕНО"}`;
  btn.style.background = enabled ? "#b30000" : "#2e7d32";
  btn.style.color = "#fff";
}

// Підв’язка кнопок toggle після завантаження DOM
function syncToggleButtonsUI() {
  // підтримка двох варіантів: або inline onclick-кнопки, або кнопки з id
  const eggsBtn =
    document.querySelector(`button[onclick="toggleEggsEdit()"]`) || $("toggleEggsEditBtn");
  const whBtn =
    document.querySelector(`button[onclick="toggleWarehouseEdit()"]`) || $("toggleWarehouseEditBtn");

  paintToggleButton(eggsBtn, eggsEditEnabled, "Редагування яєць");
  paintToggleButton(whBtn, warehouseEditEnabled, "Редагування складу");
}

// ============================
//      ТЕМА (ніч / день)
// ============================
const themeSwitch = $("themeSwitch");
if (themeSwitch) {
  themeSwitch.addEventListener("click", () => {
    document.body.classList.toggle("light");
    themeSwitch.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
  });
}

// ============================
//      НАВІГАЦІЯ
// ============================
function bindNavigation() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      if (!page) return; // тема або кнопка без page

      document.querySelectorAll(".page").forEach((p) => p.classList.remove("active-page"));
      const target = $("page-" + page);
      if (target) target.classList.add("active-page");

      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      AppState.ui.page = page;
      saveAppState();
    });
  });
}

// ============================
//      КОМПОНЕНТИ КОРМУ (РЕЦЕПТ)
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

// відповідність назв → ключі мінімумів
function getMinKeyByName(name) {
  const map = {
    "Кукурудза": "kukurudza",
    "Пшениця": "pshenytsia",
    "Ячмінь": "yachmin",
    "Соева макуха": "soieva_makuha",
    "Соняшникова макуха": "soniashnykova_makuha",
    "Рибне борошно": "rybne_boroshno",
    "Дріжджі": "drizhdzhi",
    "Трикальційфосфат": "trykaltsii_fosfat",
    "Dolfos D": "dolfos_d",
    "Сіль": "sil",
  };
  return map[name] || null;
}

// ============================
//      КАЛЬКУЛЯТОР КОРМУ
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

  document.querySelectorAll(".qty,.price,#feedVolume").forEach((el) =>
    el.addEventListener("input", calculateFeed)
  );

  calculateFeed();
}

function calculateFeed() {
  let total = 0;
  let totalKg = 0;

  feedComponents.forEach((_, i) => {
    const qty = Number(document.querySelector(`.qty[data-i="${i}"]`)?.value) || 0;
    const price = Number(document.querySelector(`.price[data-i="${i}"]`)?.value) || 0;

    localStorage.setItem("qty_" + i, String(qty));
    localStorage.setItem("price_" + i, String(price));

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

// ============================
//      СКЛАД (дані)
// ============================
let warehouse = {};
function loadWarehouse() {
  warehouse = AppState.warehouse;
}

function saveWarehouse() {
  AppState.warehouse = warehouse;
  saveAppState();
}

// ============================
//  ПОПЕРЕДЖЕННЯ МІНІМУМІВ (UI + список)
// ============================
function getMinimums() {
  // джерело: AppState
  const fromAppState = AppState?.warehouse?.minimums;
  if (fromAppState && typeof fromAppState === "object") return fromAppState;

  // fallback: старий localStorage warehouseMinimums (якщо лишився)
  try {
    return JSON.parse(localStorage.getItem("warehouseMinimums") || "{}") || {};
  } catch {
    return {};
  }
}

function applyWarehouseWarnings() {
  const box = $("warehouseWarning");
  const list = $("warehouseWarningList");
  if (!box || !list) return;

  const mins = getMinimums();
  const warnings = [];

  // компоненти
  feedComponents.forEach(([name]) => {
    const key = getMinKeyByName(name);
    if (!key) return;

    const stock = Number(warehouse.feed[name] || 0);
    const min = Number(mins[key] || 0);

    if (min > 0 && stock < min) {
      warnings.push(`• ${name}: ${stock.toFixed(2)} кг (мін. ${min})`);
    }
  });

  // лотки
  const trayMin = Number(mins.empty_trays || 0);
  const trayStock = Number(warehouse.trays || 0);
  if (trayMin > 0 && trayStock < trayMin) {
    warnings.push(`• Порожні лотки: ${trayStock} (мін. ${trayMin})`);
  }

  if (warnings.length) {
    list.innerHTML = warnings.join("<br>");
    box.style.display = "block";
  } else {
    box.style.display = "none";
    list.innerHTML = "";
  }
}

// ============================
//  RENDER СКЛАДУ
// ============================
function renderWarehouse() {
  const tbody = $("warehouseTable");
  if (!tbody) return;

  const mins = getMinimums();

  tbody.innerHTML = feedComponents
    .map(([name, need]) => {
      const stock = Number(warehouse.feed[name] || 0);

      const key = getMinKeyByName(name);
      const min = Number(mins[key] || 0);
      const isLow = min > 0 && stock < min;

      return `
        <tr style="${isLow ? "background:#3a1c1c;color:#ffb3b3;" : ""}">
          <td>${isLow ? "⚠️ " : ""}${name}</td>
          <td><input class="addStock" data-name="${name}" type="number" value="0"></td>
          <td>${need}</td>
          <td><b>${stock.toFixed(2)}</b></td>
        </tr>
      `;
    })
    .join("");

  document.querySelectorAll(".addStock").forEach((inp) => {
    inp.addEventListener("change", (e) => {
      const val = Number(e.target.value) || 0;
      e.target.value = 0;
      if (val <= 0) return;

      if (!warehouseEditEnabled) {
        alert("🔒 Спочатку увімкни редагування складу");
        return;
      }

      const name = e.target.dataset.name;
      warehouse.feed[name] = Number(warehouse.feed[name] || 0) + val;

      saveWarehouse();
      renderWarehouse();
      applyWarehouseWarnings();
    });
  });

  const trayStockEl = $("trayStock");
  if (trayStockEl) {
    trayStockEl.value = warehouse.trays ?? 0;
    trayStockEl.addEventListener("change", (e) => {
      if (!warehouseEditEnabled) {
        alert("🔒 Спочатку увімкни редагування складу");
        trayStockEl.value = warehouse.trays ?? 0;
        return;
      }
      warehouse.trays = Number(e.target.value) || 0;
      saveWarehouse();
      applyWarehouseWarnings();
    });
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

// ============================
//  КНОПКА "ЗРОБИТИ КОРМ"
// ============================
function bindMakeFeed() {
  const makeFeedBtn = $("makeFeedBtn");
  if (!makeFeedBtn) return;

  makeFeedBtn.addEventListener("click", () => {
    for (const item of feedComponents) {
      const name = item[0];
      const need = item[1];
      if (Number(warehouse.feed[name] || 0) < need) {
        alert(`Недостатньо компоненту: ${name}`);
        return;
      }
    }

    feedComponents.forEach(([name, need]) => {
      warehouse.feed[name] = Number(warehouse.feed[name] || 0) - need;
    });

    warehouse.history.push("Заміс: " + new Date().toLocaleString());
    saveWarehouse();
    renderWarehouse();
    applyWarehouseWarnings();
  });
}

// ============================
//      ЯЙЦЯ
// ============================

function recomputeEggsAccumulation() {
  const records = AppState.eggs.records;
  const dates = sortDatesAsc(Object.keys(records));

  let carry = 0;
  let totalTrays = 0;

  dates.forEach(date => {
    const e = records[date];
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

  AppState.eggs.carry = carry;
  AppState.eggs.totalTrays = totalTrays;

  const delta = totalTrays - AppState.eggs.appliedTotalTrays;
  if (delta !== 0) {
    const minReady = Math.max(AppState.warehouse.reserved || 0, 0);
    AppState.warehouse.ready = Math.max(
      (AppState.warehouse.ready || 0) + delta,
      minReady
    );
    AppState.eggs.appliedTotalTrays = totalTrays;
  }

  saveAppState();
}

function ensureEggsDate() {
  const dateInput = $("eggsDate");
  if (dateInput && !dateInput.value) {
    dateInput.value = isoToday();
  }
}

function saveEggRecord() {
  const dbg = $("debugEggs");
  if (dbg) dbg.innerHTML = "🟡 Натиснута кнопка Зберегти";

  ensureEggsDate();

  const dateInput = $("eggsDate");
  const goodInput = $("eggsGood");
  const badInput = $("eggsBad");
  const homeInput = $("eggsHome");
  const infoBox = $("eggsInfo");

  if (!dateInput || !goodInput || !badInput || !homeInput) {
    if (dbg) dbg.innerHTML += "<br>❌ Не знайдені поля форми";
    return;
  }

  const date = dateInput.value;
  const good = Number(goodInput.value) || 0;
  const bad = Number(badInput.value) || 0;
  const home = Number(homeInput.value) || 0;

  if (dbg) {
    dbg.innerHTML += `<br>📅 Дата: ${date}`;
    dbg.innerHTML += `<br>🥚 good=${good}, bad=${bad}, home=${home}`;
  }

  // ❌ перевірка логіки
  if (bad + home > good) {
    badInput.classList.add("input-error");
    homeInput.classList.add("input-error");

    if (infoBox) {
      infoBox.innerHTML = "❌ Брак + для дому > кількості яєць";
    }

    if (dbg) dbg.innerHTML += "<br>⛔ ЛОГІЧНА ПОМИЛКА";
    return;
  }

  // ✅ ЗБЕРЕЖЕННЯ
  AppState.eggs.records[date] = { good, bad, home };

  recomputeEggsAccumulation();

  const e = AppState.eggs.records[date];
  if (infoBox && e) {
    infoBox.innerHTML =
      e.sum < 20
        ? `🥚 ${e.sum} яєць (до лотка бракує ${20 - e.sum})`
        : `📦 Лотків: <b>${e.trays}</b>, залишок <b>${e.remainder}</b>`;
  }

  renderEggsReport();
  renderWarehouse();
  applyWarehouseWarnings();
  showOrders();

  if (dbg) dbg.innerHTML += "<br>✅ Запис збережено в AppState";
}

function editEgg(date) {
  const e = AppState.eggs.records[date];
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
  if (!AppState.eggs.records[date]) return;
delete AppState.eggs.records[date];

saveAppState();
  recomputeEggsAccumulation();
  renderEggsReport();
  renderWarehouse();
  applyWarehouseWarnings();
  showOrders();
}
window.deleteEgg = deleteEgg;

function clearAllEggs() {
  if (!eggsEditEnabled) {
    alert("🔒 Увімкни редагування яєць");
    return;
  }

  if (!confirm("Видалити ВЕСЬ щоденний звіт по яйцях?")) return;

  AppState.eggs.records = {};
AppState.eggs.carry = 0;
AppState.eggs.totalTrays = 0;
AppState.eggs.appliedTotalTrays = 0;
saveAppState();

  
  recomputeEggsAccumulation();
  renderEggsReport();
  if ($("eggsInfo")) $("eggsInfo").innerHTML = "";

  renderWarehouse();
  applyWarehouseWarnings();
  showOrders();

  alert("✅ Звіт по яйцях очищено");
}
window.clearAllEggs = clearAllEggs;

function renderEggsReport() {
  const list = $("eggsList");
  if (!list) return;

  const records = AppState.eggs.records;
  const dates = Object.keys(records).sort().reverse();

  if (!dates.length) {
    list.innerHTML = "<i>Записів немає</i>";
    return;
  }

  list.innerHTML = dates.map(date => {
    const e = records[date];
    return `
      <div class="egg-entry">
        <div style="display:flex; justify-content:space-between;">
          <b>${date}</b>
          <div>
            <button onclick="editEgg('${date}')">✏️</button>
            <button onclick="deleteEgg('${date}')">🗑️</button>
          </div>
        </div>
        Всього: ${e.good} | Брак: ${e.bad} | Для дому: ${e.home}<br>
        Перенос: ${e.carryIn ?? 0} → Разом: ${e.sum ?? 0}<br>
        Лотки: <b>${e.trays ?? 0}</b> | Залишок: <b>${e.remainder ?? 0}</b>
      </div>
    `;
  }).join("");
}

// кнопка "Зберегти" в яйцях (якщо у тебе id="saveEggBtn")
function bindEggSaveButton() {
  const btn = $("saveEggBtn");
  if (btn) btn.addEventListener("click", saveEggRecord);
}

// ============================
//      ЗАМОВЛЕННЯ
// ============================

function addOrder() {
  alert("addOrder() натиснуто"); // потім прибереш

  if (!AppState.orders || typeof AppState.orders !== "object") AppState.orders = {};
  orders = AppState.orders;

  const d = $("orderDate")?.value || isoToday();
  const name = $("orderName")?.value || "Без імені";
  const trays = Number($("orderTrays")?.value) || 0;
  const details = $("orderDetails")?.value || "";

  if (trays <= 0) {
    alert("Вкажи кількість лотків (> 0)");
    return;
  }

  if (!Array.isArray(orders[d])) orders[d] = [];
  orders[d].push({ name, trays, details, status: "активне" });

  warehouse.reserved = Number(warehouse.reserved || 0) + trays;
  saveWarehouse();

  AppState.orders = orders;
  saveAppState();

  showOrders();
  renderWarehouse();
  applyWarehouseWarnings();
}
window.addOrder = addOrder;

function setStatus(d, i, s) {
  const o = orders[d]?.[i];
  if (!o) return;

  if (o.status === "активне") {
    if (s === "виконано") {
      warehouse.reserved = Number(warehouse.reserved || 0) - o.trays;
      warehouse.ready = Math.max(Number(warehouse.ready || 0) - o.trays, Number(warehouse.reserved || 0));
    }
    if (s === "скасовано") {
      warehouse.reserved = Number(warehouse.reserved || 0) - o.trays;
      warehouse.ready = Math.max(Number(warehouse.ready || 0), Number(warehouse.reserved || 0));
    }
  }

  o.status = s;

  saveWarehouse();
  AppState.orders = orders;
  saveAppState();

  showOrders();
  renderWarehouse();
  applyWarehouseWarnings();
}
window.setStatus = setStatus;

function showOrders() {
  const box = $("ordersList");
  if (!box) return;

  const ready = Number(warehouse.ready || 0);
  const reserved = Number(warehouse.reserved || 0);
  const free = Math.max(ready - reserved, 0);

  let html = `
    <div style="background:#111; border:1px solid #222; padding:10px; border-radius:10px; margin:10px 0;">
      <b>Вільні лотки:</b> ${free} |
      <b>Замовлено:</b> ${reserved} |
      <b>Готові:</b> ${ready}
    </div>
  `;

  Object.keys(orders).sort().reverse().forEach((date) => {
    html += `<h3>${date}</h3>`;
    const dayOrders = Array.isArray(orders[date]) ? orders[date] : [];
    dayOrders.forEach((o, idx) => {
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
//      TOGGLE (ЯЙЦЯ / СКЛАД)
// ============================
function toggleEggsEdit() {
  eggsEditEnabled = !eggsEditEnabled;
  AppState.ui.eggsEditEnabled = eggsEditEnabled;
  saveAppState();
  syncToggleButtonsUI();
  alert(eggsEditEnabled ? "🔓 Редагування яєць УВІМКНЕНО" : "🔒 Редагування яєць ВИМКНЕНО");
}
window.toggleEggsEdit = toggleEggsEdit;

function toggleWarehouseEdit() {
  warehouseEditEnabled = !warehouseEditEnabled;
  AppState.ui.warehouseEditEnabled = warehouseEditEnabled;
  saveAppState();
  syncToggleButtonsUI();
  alert(warehouseEditEnabled ? "🔓 Редагування складу УВІМКНЕНО" : "🔒 Редагування складу ВИМКНЕНО");
}
window.toggleWarehouseEdit = toggleWarehouseEdit;

// ============================
//   ОЧИСТКА СКЛАДУ / ЛОТКІВ
// ============================
function clearFeedComponents() {
  if (!warehouseEditEnabled) {
    alert("🔒 Спочатку увімкни редагування складу");
    return;
  }
  if (!confirm("Очистити ВСІ кормові компоненти на складі?")) return;

  warehouse.feed = {};
  saveWarehouse();
  renderWarehouse();
  applyWarehouseWarnings();

  alert("✅ Компоненти складу очищено");
}
window.clearFeedComponents = clearFeedComponents;

function clearEggTrays() {
  if (!eggsEditEnabled) {
    alert("🔒 Спочатку увімкни редагування яєць");
    return;
  }
  if (!confirm("Очистити ВСІ лотки з яйцями? (готові + резерв)")) return;

  warehouse.ready = 0;
  warehouse.reserved = 0;

  AppState.eggs.appliedTotalTrays = AppState.eggs.totalTrays;
  
saveAppState();
  saveWarehouse();
  renderWarehouse();
  applyWarehouseWarnings();
  showOrders();

  alert("✅ Лотки з яйцями очищено");
}
window.clearEggTrays = clearEggTrays;

// ============================
//  НАЛАШТУВАННЯ (мінімальні запаси) — SAVE/LOAD UI
// ============================
function saveWarehouseSettings() {
  try {
    const mins = {};

    feedComponents.forEach(([name]) => {
      const key = getMinKeyByName(name);
      if (!key) return;

      const input = document.getElementById("minFeed_" + key);
      mins[key] = Number(input?.value || 0);
    });

    mins.empty_trays = Number(document.getElementById("min_empty_trays")?.value || 0);

    AppState.warehouse.minimums = mins;
    saveAppState();

    const status = $("settingsStatus");
    if (status) status.innerHTML = "✅ Дані збережено";

    applyWarehouseWarnings();
    renderWarehouse();
  } catch (e) {
    console.error("saveWarehouseSettings error:", e);
    const status = $("settingsStatus");
    if (status) status.innerHTML = "❌ Не вдалося зберегти";
    alert("❌ Не вдалося зберегти налаштування");
  }
}
window.saveWarehouseSettings = saveWarehouseSettings;

function loadWarehouseSettingsUI() {
  const mins = getMinimums();

  feedComponents.forEach(([name]) => {
    const key = getMinKeyByName(name);
    if (!key) return;

    const input = document.getElementById("minFeed_" + key);
    if (input) input.value = mins[key] ?? 0;
  });

  const traysInput = document.getElementById("min_empty_trays");
  if (traysInput) traysInput.value = mins.empty_trays ?? 0;
}

function bindSettingsSaveButton() {
  const btn = document.getElementById("saveWarehouseSettingsBtn");
  if (!btn) {
    console.warn("❌ saveWarehouseSettingsBtn не знайдена");
    return;
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    saveWarehouseSettings();
  });
}

function restoreActivePage() {
  const page = AppState.ui.page || "calculator";

  // показ сторінки
  document.querySelectorAll(".page").forEach(p =>
    p.classList.remove("active-page")
  );
  const target = document.getElementById("page-" + page);
  if (target) target.classList.add("active-page");

  // підсвітка кнопки
  document.querySelectorAll(".nav-btn").forEach(b =>
    b.classList.remove("active")
  );
  const btn = document.querySelector(`.nav-btn[data-page="${page}"]`);
  if (btn) btn.classList.add("active");
}

// ============================
//      START (ОДИН РАЗ)
// ============================
document.addEventListener("DOMContentLoaded", () => {
  loadAppState();

  migrateWarehouseToAppState();
  migrateEggsToAppState();   // ← 🆕 КРОК 5
  migrateOrdersToAppState();

  eggsEditEnabled = !!AppState.ui.eggsEditEnabled;
  warehouseEditEnabled = !!AppState.ui.warehouseEditEnabled;

  loadWarehouse();
  loadOrders();

  bindNavigation();
  restoreActivePage();
  bindMakeFeed();
  bindEggSaveButton();
  bindSettingsSaveButton();

  loadFeedTable();
  renderWarehouse();
  applyWarehouseWarnings();

  recomputeEggsAccumulation();
  renderEggsReport();
  showOrders();

  loadWarehouseSettingsUI();
  syncToggleButtonsUI();
});