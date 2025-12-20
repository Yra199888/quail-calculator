// ============================
//      ДОПОМІЖНІ
// ============================
import { EggsFormController } from "./controllers/EggsFormController.js";
import { FeedFormController } from "./controllers/FeedFormController.js";
import { FeedRecipesController } from "./controllers/FeedRecipesController.js";

const $ = (id) => document.getElementById(id);

window.onerror = function (msg, src, line, col) {
  console.error("JS error:", msg, src, line, col);
  toast(`Помилка: ${msg} (рядок ${line}:${col})`, "error", 4500);
};

function toast(msg, type="warn", ms=2200){
  const el = document.getElementById("toast");
  if (!el) return alert(msg);
  el.className = `toast ${type} show`;
  el.textContent = msg;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), ms);
}

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
    feed: {
      components: [
        { key: "kukurudza", name: "Кукурудза", defaultQty: 10 },
        { key: "pshenytsia", name: "Пшениця", defaultQty: 5 },
        { key: "yachmin", name: "Ячмінь", defaultQty: 1.5 },
        { key: "soieva_makuha", name: "Соева макуха", defaultQty: 3 },
        { key: "soniashnykova_makuha", name: "Соняшникова макуха", defaultQty: 2.5 },
        { key: "rybne_boroshno", name: "Рибне борошно", defaultQty: 1 },
        { key: "drizhdzhi", name: "Дріжджі", defaultQty: 0.7 },
        { key: "trykaltsii_fosfat", name: "Трикальційфосфат", defaultQty: 0.5 },
        { key: "dolfos_d", name: "Dolfos D", defaultQty: 0.7 },
        { key: "sil", name: "Сіль", defaultQty: 0.05 }
      ]
    },
    trays: 0,
    ready: 0,
    reserved: 0,
    history: [],
    minimums: {}
  },

  eggs: {
    records: {},
    carry: 0,
    totalTrays: 0,
  },
  
  feedCalculator: {
  qty: [],
  price: [],
  volume: 25
},
  feedComponents: [], // ✅ НОВЕ

  recipes: {
  list: {},
  selectedId: null
},

  feedMixes: {
  history: []
},

  orders: {
  list: []
},
};

let appStateLoadedFromStorage = false;

function loadAppState() {
  try {
    const saved = JSON.parse(localStorage.getItem("AppState"));
    if (saved && typeof saved === "object") {
      Object.assign(AppState.ui, saved.ui || {});
      Object.assign(AppState.warehouse, saved.warehouse || {});
      Object.assign(AppState.eggs, saved.eggs || {});
      Object.assign(AppState.feedCalculator, saved.feedCalculator || {});
      Object.assign(AppState.orders, saved.orders || {}); // ✅ ОСЬ ЦЕГО НЕ ВИСТАЧАЛО
      Object.assign(AppState.recipes, saved.recipes || {});
      Object.assign(AppState.feedMixes, saved.feedMixes || {});
      
      if (Array.isArray(saved.feedComponents)) {
      AppState.feedComponents = saved.feedComponents;
      }
      
      appStateLoadedFromStorage = true;
    }
  } catch (e) {
    console.warn("AppState load failed", e);
  }
}

function recomputeWarehouseFromSources() {
  const total = Number(AppState.eggs.totalTrays || 0);
  const reserved = Number(AppState.warehouse.reserved || 0);

  AppState.warehouse.ready = Math.max(total - reserved, 0);
}

function ensureOrdersShape() {
  if (!AppState.orders || typeof AppState.orders !== "object") {
    AppState.orders = { list: [] };
  }
  if (!Array.isArray(AppState.orders.list)) {
    AppState.orders.list = [];
  }
}

function validateState(context = "") {
  const errors = [];

  if (!AppState || typeof AppState !== "object") {
    errors.push("AppState не object");
    return errors;
  }

  if (!AppState.warehouse || typeof AppState.warehouse !== "object") {
    errors.push("warehouse відсутній");
  }

  if (!AppState.eggs || typeof AppState.eggs !== "object") {
    errors.push("eggs відсутні");
  }

  if (!AppState.orders || typeof AppState.orders !== "object") {
  errors.push("orders відсутній");
  } else if (!Array.isArray(AppState.orders.list)) {
  errors.push("orders.list не масив");
  }

if (errors.length) {
  console.warn("❌ validateState", context, errors);
} else {
  console.log("✅ validateState OK", context);
}

  return errors;
}

function saveAppState() {
  try {
    localStorage.setItem("AppState", JSON.stringify(AppState));
  } catch (e) {
    console.error("AppState save failed", e);
  }
}

function ensureWarehouseShape() {
  if (!AppState.warehouse || typeof AppState.warehouse !== "object") {
    AppState.warehouse = {};
  }

  if (!AppState.warehouse.feed || typeof AppState.warehouse.feed !== "object") {
    AppState.warehouse.feed = {};
  }

  if (!Array.isArray(AppState.warehouse.history)) {
    AppState.warehouse.history = [];
  }

  if (!AppState.warehouse.minimums || typeof AppState.warehouse.minimums !== "object") {
    AppState.warehouse.minimums = {};
  }

for (const c of getAllFeedComponents()) {
  AppState.warehouse.feed[c.id] =
    Number(AppState.warehouse.feed[c.id] || 0);
}

  AppState.warehouse.trays = Number(AppState.warehouse.trays || 0);
  AppState.warehouse.ready = Number(AppState.warehouse.ready || 0);
  AppState.warehouse.reserved = Number(AppState.warehouse.reserved || 0);
}

function ensureFeedCalculatorShape() {
  if (!AppState.feedCalculator || typeof AppState.feedCalculator !== "object") {
    AppState.feedCalculator = { qty: [], price: [], volume: 25 };
  }

  const list = getActiveFeedComponents();

  list.forEach((c, i) => {
    AppState.feedCalculator.qty[i] =
      Number(AppState.feedCalculator.qty[i] ?? c.defaultQty);

    AppState.feedCalculator.price[i] =
      Number(AppState.feedCalculator.price[i] ?? 0);
  });

  AppState.feedCalculator.volume =
    Number(AppState.feedCalculator.volume ?? 25);
}

function ensureRecipesShape() {
  if (!AppState.recipes || typeof AppState.recipes !== "object") {
    AppState.recipes = {};
  }
  if (!AppState.recipes.list || typeof AppState.recipes.list !== "object") {
    AppState.recipes.list = {};
  }
  if (!("selectedId" in AppState.recipes)) {
    AppState.recipes.selectedId = null;
  }
}

function ensureFeedMixesShape() {
  if (!AppState.feedMixes || typeof AppState.feedMixes !== "object") {
    AppState.feedMixes = { history: [] };
  }
  if (!Array.isArray(AppState.feedMixes.history)) {
    AppState.feedMixes.history = [];
  }
}

function ensureFeedComponentsShape() {
  // 1) якщо масиву нема — створити
  if (!Array.isArray(AppState.feedComponents)) {
    AppState.feedComponents = [];
  }

  // 2) якщо пустий — заповнити дефолтними (лише 1 раз)
  if (AppState.feedComponents.length === 0) {
    AppState.feedComponents = [
      { id: "kukurudza", name: "Кукурудза", defaultQty: 10, enabled: true },
      { id: "pshenytsia", name: "Пшениця", defaultQty: 5, enabled: true },
      { id: "yachmin", name: "Ячмінь", defaultQty: 1.5, enabled: true },
      { id: "soieva_makuha", name: "Соева макуха", defaultQty: 3, enabled: true },
      { id: "soniashnykova_makuha", name: "Соняшникова макуха", defaultQty: 2.5, enabled: true },
      { id: "rybne_boroshno", name: "Рибне борошно", defaultQty: 1, enabled: true },
      { id: "drizhdzhi", name: "Дріжджі", defaultQty: 0.7, enabled: true },
      { id: "trykaltsii_fosfat", name: "Трикальційфосfat", defaultQty: 0.5, enabled: true },
      { id: "dolfos_d", name: "Dolfos D", defaultQty: 0.7, enabled: true },
      { id: "sil", name: "Сіль", defaultQty: 0.05, enabled: true },
    ];
  }

  // 3) нормалізація полів
  AppState.feedComponents = AppState.feedComponents.map(c => ({
    id: String(c.id || "").trim(),
    name: String(c.name || "").trim(),
    defaultQty: Number(c.defaultQty || 0),
    enabled: c.enabled !== false,
  })).filter(c => c.id && c.name);
}


  function getCurrentFeedSnapshot() {
    // беремо поточні значення з AppState (а не з DOM)
    const qty = AppState.feedCalculator.qty.map(x => Number(x) || 0);
    const price = AppState.feedCalculator.price.map(x => Number(x) || 0);
    const volume = Number(AppState.feedCalculator.volume || 0);
  
    let totalCost = 0;
    let totalKg = 0;
  
    feedComponents.forEach(([name], i) => {
      const q = qty[i] || 0;
      const p = price[i] || 0;
      totalKg += q;
      totalCost += q * p;
    });
  
    const perKg = totalKg > 0 ? totalCost / totalKg : 0;
  
    return { qty, price, volume, totalCost, totalKg, perKg };
  }
  
  function addFeedMixToHistory(meta = {}) {
    const snap = getCurrentFeedSnapshot();
  
    const entry = {
      id: String(Date.now()) + "_" + Math.random().toString(16).slice(2),
      createdAt: new Date().toISOString(),
      // мета-дані (назва рецепта, коментар тощо)
      recipeName: meta.recipeName || "",
      note: meta.note || "",
      // знімок калькулятора
      volume: snap.volume,
      qty: snap.qty,
      price: snap.price,
      totalCost: snap.totalCost,
      perKg: snap.perKg
    };
  
    AppState.feedMixes.history.unshift(entry);
    saveAppState();
  }
  
  function renderMixHistory() {
    const box = document.getElementById("mixHistory");
    if (!box) return;
  
    const list = AppState.feedMixes?.history || [];
    if (!list.length) {
      box.innerHTML = "<i>Порожньо</i>";
      return;
    }
  
    box.innerHTML = list.map(x => {
      const dt = new Date(x.createdAt);
      const dateStr = isNaN(dt.getTime()) ? x.createdAt : dt.toLocaleString();
  
      const title = x.recipeName ? `🍲 ${x.recipeName}` : "🍲 Заміс";
      const cost = Number(x.totalCost || 0).toFixed(2);
      const perKg = Number(x.perKg || 0).toFixed(2);
      const vol = Number(x.volume || 0);
  
      return `
        <div class="order-entry" style="padding:10px;margin-bottom:10px;border-radius:6px;background:#111;border-left:4px solid #4caf50;">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
            <div>
              <b>${title}</b><br>
              <small>${dateStr}</small><br>
              Обʼєм: <b>${vol}</b> кг<br>
              Собівартість: <b>${cost}</b> грн (≈ <b>${perKg}</b> грн/кг)
              ${x.note ? `<br><small>${x.note}</small>` : ""}
            </div>
  
            <div style="text-align:right;">
              <button class="main-btn danger" style="padding:6px 10px;" onclick="deleteMix('${x.id}')">🗑️</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }
  
  function deleteMix(id) {
    AppState.feedMixes.history = (AppState.feedMixes.history || []).filter(x => x.id !== id);
    saveAppState();
    renderMixHistory();
  }
  window.deleteMix = deleteMix;
  
  function bindMixHistoryUI() {
    const btn = document.getElementById("clearMixHistoryBtn");
    if (!btn) return;
  
    btn.addEventListener("click", () => {
      if (!confirm("Очистити історію замісів?")) return;
      AppState.feedMixes.history = [];
      saveAppState();
      renderMixHistory();
    });
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
      if (!target) {
      toast(`Сторінка page-${page} не знайдена`, "error", 3000);
      return;
      }
      target.classList.add("active-page");
      
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      AppState.ui.page = page;
      saveAppState();
    });
  });
}

function getActiveFeedComponents() {
  return (AppState.feedComponents || []).filter(c => c.enabled);
}

function getAllFeedComponents() {
  return (AppState.feedComponents || []);
}

// ============================
//      КАЛЬКУЛЯТОР КОРМУ
// ============================



function loadFeedTable() {
  const tbody = $("feedTable");
  if (!tbody) return;

  const list = getActiveFeedComponents();

tbody.innerHTML = list.map((c, i) => `
  <tr>
    <td>${c.name}</td>
    <td><input class="qty" data-i="${i}" type="number" value="${AppState.feedCalculator.qty[i] ?? c.defaultQty}"></td>
    <td><input class="price" data-i="${i}" type="number" value="${AppState.feedCalculator.price[i] ?? 0}"></td>
    <td id="sum_${i}">0</td>
  </tr>
`).join("");

  const volEl = $("feedVolume");
  if (volEl) volEl.value = AppState.feedCalculator.volume ?? 25;

  calculateFeed();
}

function calculateFeed() {
  let total = 0;
  let totalKg = 0;

  const list = getActiveFeedComponents();

  list.forEach((c, i) => {
    const qty = Number(document.querySelector(`.qty[data-i="${i}"]`)?.value) || 0;
    const price = Number(document.querySelector(`.price[data-i="${i}"]`)?.value) || 0;

    AppState.feedCalculator.qty[i] = qty;
    AppState.feedCalculator.price[i] = price;

    const sum = qty * price;
    total += sum;
    totalKg += qty;

    const cell = $("sum_" + i);
    if (cell) cell.textContent = sum.toFixed(2);
  });

  const perKg = totalKg ? total / totalKg : 0;
  const vol = Number($("feedVolume")?.value) || 0;

  AppState.feedCalculator.volume = vol;

  $("feedTotal").textContent = total.toFixed(2);
  $("feedPerKg").textContent = perKg.toFixed(2);
  $("feedVolumeTotal").textContent = (perKg * vol).toFixed(2);

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
  const listEl = $("warehouseWarningList");
  if (!box || !listEl) return;

  const mins = AppState.warehouse.minimums || {};
  const warnings = [];

  // кормові компоненти
  for (const c of getAllFeedComponents()) {
    const stock = Number(AppState.warehouse.feed[c.id] || 0);
    const min = Number(mins[c.id] || 0);

    if (min > 0 && stock < min) {
      warnings.push(`• ${c.name}: ${stock.toFixed(2)} кг (мін. ${min})`);
    }
  }

  // порожні лотки
  const trayMin = Number(mins.empty_trays || 0);
  const trayStock = Number(AppState.warehouse.trays || 0);
  if (trayMin > 0 && trayStock < trayMin) {
    warnings.push(`• Порожні лотки: ${trayStock} (мін. ${trayMin})`);
  }

  if (warnings.length) {
    listEl.innerHTML = warnings.join("<br>");
    box.style.display = "block";
  } else {
    box.style.display = "none";
    listEl.innerHTML = "";
  }
}

// ============================
//  RENDER СКЛАДУ
// ============================
function renderWarehouse() {
  const tbody = $("warehouseTable");
  if (!tbody) return;

  const mins = AppState.warehouse.minimums || {};
  const components = getAllFeedComponents();

  tbody.innerHTML = components.map(c => {
    const stock = Number(AppState.warehouse.feed[c.id] || 0);
    const min = Number(mins[c.id] || 0);
    const isLow = min > 0 && stock < min;

    return `
      <tr style="${isLow ? "background:#3a1c1c;color:#ffb3b3;" : ""}">
        <td>${isLow ? "⚠️ " : ""}${c.name}</td>
        <td>
          <input class="addStock" data-id="${c.id}" type="number" value="0">
        </td>
        <td>${c.defaultQty}</td>
        <td><b>${stock.toFixed(2)}</b></td>
      </tr>
    `;
  }).join("");

  // додавання на склад
  document.querySelectorAll(".addStock").forEach(inp => {
    inp.addEventListener("change", e => {
      if (!warehouseEditEnabled) {
        alert("🔒 Спочатку увімкни редагування складу");
        e.target.value = 0;
        return;
      }

      const val = Number(e.target.value || 0);
      if (val <= 0) return;

      const id = e.target.dataset.id;
      AppState.warehouse.feed[id] =
        Number(AppState.warehouse.feed[id] || 0) + val;

      e.target.value = 0;

      saveAppState();
      renderWarehouse();
      applyWarehouseWarnings();
    });
  });

  // лотки
  if ($("fullTrays")) $("fullTrays").textContent = AppState.warehouse.ready || 0;
  if ($("reservedTrays")) $("reservedTrays").textContent = AppState.warehouse.reserved || 0;
}

// ============================
//  КНОПКА "ЗРОБИТИ КОРМ"
// ============================
function bindMakeFeed() {
  const btn = $("makeFeedBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (!warehouseEditEnabled) {
      alert("🔒 Спочатку увімкни редагування складу");
      return;
    }

    const components = getActiveFeedComponents();

    // перевірка наявності
    for (let i = 0; i < components.length; i++) {
      const c = components[i];
      const need = Number(AppState.feedCalculator.qty[i] || 0);
      const stock = Number(AppState.warehouse.feed[c.id] || 0);

      if (need > stock) {
        alert(`Недостатньо компоненту: ${c.name}`);
        return;
      }
    }

    // списання
    components.forEach((c, i) => {
      const need = Number(AppState.feedCalculator.qty[i] || 0);
      AppState.warehouse.feed[c.id] -= need;
    });

    // історія
    AppState.feedMixes.history.push({
      date: new Date().toISOString(),
      components: components.map((c, i) => ({
        id: c.id,
        name: c.name,
        qty: AppState.feedCalculator.qty[i] || 0
      }))
    });

    saveAppState();
    renderWarehouse();
    applyWarehouseWarnings();

    alert("✅ Корм успішно замішано");
  });
}

function renderFeedMixHistory() {
  const box = document.getElementById("mixHistory");
  if (!box) return;

  if (!AppState.feedMixes.history.length) {
    box.innerHTML = "<i>Історія замісів порожня</i>";
    return;
  }

  box.innerHTML = AppState.feedMixes.history
    .slice()
    .reverse()
    .map(mix => `
      <div class="mix-entry">
        <b>${mix.recipeName}</b> — ${mix.volume} кг<br>
        <small>${mix.date}</small>
      </div>
    `)
    .join("");
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

  recomputeWarehouseFromSources();
}

function deleteEgg(date) {
  if (!eggsEditEnabled) {
    alert("🔒 Увімкни редагування яєць");
    return;
  }
  if (!AppState.eggs.records[date]) return;
delete AppState.eggs.records[date];


  recomputeEggsAccumulation();
  saveAppState();
  renderEggsReport();
  renderWarehouse();
  applyWarehouseWarnings();
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
            <button onclick='eggsForm.startEdit("${date}", ${JSON.stringify(e)})'>✏️</button>
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

// ============================
//      ЗАМОВЛЕННЯ
// ============================

function uid() {
  return String(Date.now()) + "_" + Math.random().toString(16).slice(2);
}

function getOrderById(id) {
  return AppState.orders.list.find(o => o.id === id);
}

function formatStatus(s) {
  const map = {
    draft: "Чернетка",
    confirmed: "Підтверджено",
    delivered: "Видано",
    cancelled: "Скасовано"
  };
  return map[s] || s;
}

function addOrderFromForm(data) {
  const { date, client, trays, details } = data;
  
  if (!client) {
  toast("Вкажи клієнта", "warn");
  markError(document.getElementById("orderClient"));
  return;
}
if (trays <= 0) {
  toast("Вкажи кількість лотків (>0)", "warn");
  markError(document.getElementById("orderTrays"));
  return;
}

  recomputeWarehouseFromSources();
  const free = Number(AppState.warehouse.ready || 0);

  if (trays > free) {
    toast(`Недостатньо вільних лотків. Доступно: ${free}`, "error", 3500);
    return alert(`Недостатньо вільних лотків. Доступно: ${free}`);
  }

  AppState.warehouse.reserved += trays;
  recomputeWarehouseFromSources();

  AppState.orders.list.push({
    id: uid(),
    date,
    client,
    trays,
    details,
    status: "confirmed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  saveAppState();
  renderWarehouse();
  renderOrders();

}

function setOrderStatus(id, nextStatus) {
  const o = getOrderById(id);
  if (!o) return;

  const prevStatus = o.status;

  // якщо був confirmed і стає cancelled/delivered — знімаємо резерв
  if (prevStatus === "confirmed" && (nextStatus === "cancelled" || nextStatus === "delivered")) {
    AppState.warehouse.reserved = Math.max(Number(AppState.warehouse.reserved || 0) - Number(o.trays || 0), 0);
  }

  // якщо був cancelled/draft і стає confirmed — треба ДОрезервувати
  if ((prevStatus === "draft" || prevStatus === "cancelled") && nextStatus === "confirmed") {
    recomputeWarehouseFromSources();
    const free = Number(AppState.warehouse.ready || 0);

    if (Number(o.trays || 0) > free) {
      return alert(`Недостатньо вільних лотків для підтвердження. Доступно: ${free}`);
    }

    AppState.warehouse.reserved = Number(AppState.warehouse.reserved || 0) + Number(o.trays || 0);
  }

  o.status = nextStatus;
  o.updatedAt = new Date().toISOString();

  recomputeWarehouseFromSources();
  saveAppState();
  renderWarehouse();
  renderOrders();
}
window.setOrderStatus = setOrderStatus;

function deleteOrder(id) {
  const o = getOrderById(id);
  if (!o) return;

  if (!confirm("Видалити замовлення?")) return;

  if (o.status === "confirmed") {
    AppState.warehouse.reserved = Math.max(Number(AppState.warehouse.reserved || 0) - Number(o.trays || 0), 0);
  }

  AppState.orders.list = AppState.orders.list.filter(x => x.id !== id);

  recomputeWarehouseFromSources();
  saveAppState();
  renderWarehouse();
  renderOrders();
}
window.deleteOrder = deleteOrder;

function renderOrders() {
  const box = $("ordersList");
  if (!box) return;

  const list = AppState.orders.list.slice();

  if (!list.length) {
    box.innerHTML = "<i>Замовлень немає</i>";
    updateOrdersSummary(); // 👈 ТУТ ТЕЖ, щоб 0 показувало
    return;
  }

  const statusOrder = {
    confirmed: 1,
    delivered: 2,
    cancelled: 3
  };

  list.sort((a, b) => {
    const sa = statusOrder[a.status] || 99;
    const sb = statusOrder[b.status] || 99;
    if (sa !== sb) return sa - sb;
    return a.date < b.date ? 1 : -1;
  });

  box.innerHTML = list.map(o => {
    let bg = "";
    let badge = "";

    if (o.status === "confirmed") {
      bg = "background:#1b3d1b;border-left:4px solid #4caf50;";
      badge = "🟢 Підтверджено";
    } else if (o.status === "delivered") {
      bg = "background:#2b2b2b;border-left:4px solid #9e9e9e;";
      badge = "⚪ Видано";
    } else if (o.status === "cancelled") {
      bg = "background:#3d1b1b;border-left:4px solid #f44336;";
      badge = "🔴 Скасовано";
    }

    let actions = "";

    if (o.status === "confirmed") {
      actions = `
        <button onclick="setOrderStatus('${o.id}','delivered')">📦 Видано</button>
        <button onclick="setOrderStatus('${o.id}','cancelled')">❌ Скасувати</button>
      `;
    } else {
      actions = `
        <button onclick="deleteOrder('${o.id}')">🗑️ Видалити</button>
      `;
    }

    return `
      <div class="order-entry" style="padding:10px;margin-bottom:10px;border-radius:6px;${bg}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
          <div>
            <b>${o.date}</b> — <b>${o.client}</b><br>
            Лотків: <b>${o.trays}</b><br>
            <small>${o.details || ""}</small>
          </div>

          <div style="text-align:right;">
            <div style="margin-bottom:6px;"><b>${badge}</b></div>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${actions}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  updateOrdersSummary(); // ✅ ОСЬ САМЕ ЦЕЙ РЯДОК
}

function updateOrdersSummary() {
  const countEl = document.getElementById("activeOrdersCount");
  const traysEl = document.getElementById("activeOrdersTrays");

  if (!countEl || !traysEl) return;

  const active = AppState.orders.list.filter(o => o.status === "confirmed");

  countEl.textContent = active.length;
  traysEl.textContent = active.reduce(
    (sum, o) => sum + Number(o.trays || 0),
    0
  );
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

  AppState.warehouse.feed = {};
  saveAppState();
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

  AppState.warehouse.reserved = 0;
  recomputeWarehouseFromSources();
  saveAppState();
  renderWarehouse();
  applyWarehouseWarnings();

  alert("✅ Лотки з яйцями очищено");
}
window.clearEggTrays = clearEggTrays;

// ============================
//  НАЛАШТУВАННЯ (мінімальні запаси) — SAVE/LOAD UI
// ============================
function saveWarehouseSettings() {
  const mins = {};

  getAllFeedComponents().forEach(c => {
    const input = document.getElementById("minFeed_" + c.id);
    mins[c.id] = Number(input?.value || 0);
  });

  mins.empty_trays = Number(document.getElementById("min_empty_trays")?.value || 0);

  AppState.warehouse.minimums = mins;
  saveAppState();

  applyWarehouseWarnings();
  renderWarehouse();

  if ($("settingsStatus")) {
    $("settingsStatus").textContent = "✅ Дані збережено";
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

function cleanupLegacyLocalStorage() {
  // старі ключі калькулятора
  for (let i = 0; i < feedComponents.length; i++) {
    localStorage.removeItem("qty_" + i);
    localStorage.removeItem("price_" + i);
  }
  // якщо використовувався старий ключ мінімумів
  localStorage.removeItem("warehouseMinimums");
}

function markError(el){
  if (!el) return;
  el.classList.add("input-error");
  setTimeout(() => el.classList.remove("input-error"), 1200);
}

function bindOrdersUX(){
  const btn = document.getElementById("addOrderBtn");
  const clientEl = document.getElementById("orderClient");
  const traysEl  = document.getElementById("orderTrays");
  if (!btn || !clientEl || !traysEl) return;

  const sync = () => {
    const ok = clientEl.value.trim().length > 0 && Number(traysEl.value) > 0;
    btn.disabled = !ok;
    btn.style.opacity = ok ? "1" : "0.6";
  };

  clientEl.addEventListener("input", sync);
  traysEl.addEventListener("input", sync);
  sync();
}

function renderComponentsTable() {
  const tbody = document.getElementById("componentsTable");
  if (!tbody) return;

  tbody.innerHTML = AppState.feedComponents.map(c => `
    <tr>
      <td>
        <input value="${c.name}" 
               onchange="renameComponent('${c.id}', this.value)">
      </td>
      <td><code>${c.id}</code></td>
      <td>
        <button onclick="deleteComponent('${c.id}')">🗑️</button>
      </td>
    </tr>
  `).join("");

  refreshReplaceSelectors();
}

function renameComponent(id, newName) {
  const c = AppState.feedComponents.find(x => x.id === id);
  if (!c) return;

  c.name = newName.trim();
  saveAppState();

  loadFeedTable();
  renderWarehouse();
}

function addNewComponent() {
  const name = document.getElementById("newComponentName").value.trim();
  const id = document.getElementById("newComponentId").value.trim();

  if (!name || !id) {
    alert("Вкажи назву і ID");
    return;
  }

  if (AppState.feedComponents.some(c => c.id === id)) {
    alert("Такий ID вже існує");
    return;
  }

  AppState.feedComponents.push({ id, name, unit: "kg" });
  saveAppState();

  renderComponentsTable();
  loadFeedTable();
}

function replaceComponentUI() {
  const from = document.getElementById("replaceFrom").value;
  const to = document.getElementById("replaceTo").value;

  if (!from || !to || from === to) {
    alert("Невірний вибір");
    return;
  }

  replaceComponentId(from, AppState.feedComponents.find(c => c.id === to));
}

function refreshReplaceSelectors() {
  const fromSel = document.getElementById("replaceFrom");
  const toSel = document.getElementById("replaceTo");
  if (!fromSel || !toSel) return;

  const opts = AppState.feedComponents
    .map(c => `<option value="${c.id}">${c.name}</option>`)
    .join("");

  fromSel.innerHTML = "<option value=''>Замість…</option>" + opts;
  toSel.innerHTML = "<option value=''>На…</option>" + opts;
}




// ============================
//      START (ОДИН РАЗ)
// ============================
let eggsForm;
let feedForm;
let feedRecipesController;

document.addEventListener("DOMContentLoaded", () => {
  try {
    // ============================
    // 1) Load AppState
    // ============================
    loadAppState();

    // ============================
    // 2) One-time legacy cleanup
    // ============================
    if (!localStorage.getItem("legacyCleaned")) {
      cleanupLegacyLocalStorage();
      localStorage.setItem("legacyCleaned", "1");
      console.log("🧹 Legacy localStorage очищено");
    }

    // ============================
    // 3) Ensure AppState shapes
    // ============================
    ensureFeedComponentsShape();
    ensureWarehouseShape();
    ensureFeedCalculatorShape();
    ensureOrdersShape();
    ensureRecipesShape();
    ensureFeedMixesShape();
    ensureFeedComponentsShape();

    eggsEditEnabled = !!AppState.ui.eggsEditEnabled;
    warehouseEditEnabled = !!AppState.ui.warehouseEditEnabled;

    // ============================
    // 4) Recompute derived data
    // ============================
    recomputeEggsAccumulation();
    recomputeWarehouseFromSources();

    // ============================
    // 5) Navigation
    // ============================
    bindNavigation();
    restoreActivePage();

    // ============================
    // 6) Initial render
    // ============================
    loadFeedTable();
    renderWarehouse();
    renderMixHistory();
    bindMixHistoryUI();
    applyWarehouseWarnings();
    renderEggsReport();
    renderOrders();
    bindOrdersUX();
    renderFeedMixHistory();
    renderComponentsTable();

    // ============================
    // 7) FeedFormController (calculator inputs)
    // ============================
    feedForm = new FeedFormController({
      onChange: ({ type, index, value }) => {
        if (type === "qty") AppState.feedCalculator.qty[index] = value;
        if (type === "price") AppState.feedCalculator.price[index] = value;
        if (type === "volume") AppState.feedCalculator.volume = value;

        calculateFeed();
        saveAppState();
      }
    });
    feedForm.init();

    // ============================
    // 8) FeedRecipesController (ONE TIME!)
    // ============================
    feedRecipesController = new FeedRecipesController({
      AppState,
      saveAppState,
      refreshUI: () => {
        loadFeedTable();
        calculateFeed();
      }
    });

    // ============================
    // 9) EggsFormController
    // ============================
    eggsForm = new EggsFormController({
      onSave: ({ date, good, bad, home }) => {
        AppState.eggs.records[date] = { good, bad, home };

        recomputeEggsAccumulation();
        saveAppState();

        renderEggsReport();
        renderWarehouse();
        applyWarehouseWarnings();
      }
    });

    // доступ для inline onclick
    window.eggsForm = eggsForm;

    // ============================
    // 10) Bind buttons & settings
    // ============================
    bindMakeFeed();
    bindSettingsSaveButton();
    syncToggleButtonsUI();
    loadWarehouseSettingsUI();

    // ============================
    // 11) Final validation
    // ============================
    saveAppState();
    validateState("after START");
    console.log("✅ App initialized");

  } catch (e) {
    console.error("❌ Startup error:", e);
    alert("❌ Помилка запуску. Відкрий Console і скинь помилку сюди.");
  }
});