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
    records: {},
    carry: 0,
    totalTrays: 0,
  },

  feedCalculator: {          // 👈 НОВЕ
    qty: [],
    price: [],
    volume: 25
  }
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

      appStateLoadedFromStorage = true; // 🔑 КРИТИЧНО
    }
  } catch (e) {
    console.warn("AppState load failed", e);
  }
}

function recomputeWarehouseFromSources() {
  const total = Number(AppState.eggs.totalTrays || 0);

  AppState.warehouse.reserved = 0;
  AppState.warehouse.ready = total;
}


function migrateWarehouseToAppState() {
  if (appStateLoadedFromStorage) return;
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

    if (!appStateLoadedFromStorage) {
  saveAppState();
}

    console.log("✅ Warehouse мігровано в AppState");
  } catch (e) {
    console.warn("❌ Не вдалося мігрувати склад", e);
  }
}

function migrateEggsToAppState() {
  if (appStateLoadedFromStorage) return;
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

    if (!appStateLoadedFromStorage) {
  saveAppState();
}

    console.log("✅ Eggs мігровано в AppState");
  } catch (e) {
    console.warn("❌ Не вдалося мігрувати яйця", e);
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

  AppState.warehouse.trays = Number(AppState.warehouse.trays || 0);
  AppState.warehouse.ready = Number(AppState.warehouse.ready || 0);
  AppState.warehouse.reserved = Number(AppState.warehouse.reserved || 0);
}

function ensureFeedCalculatorShape() {
  if (!AppState.feedCalculator || typeof AppState.feedCalculator !== "object") {
    AppState.feedCalculator = { qty: [], price: [], volume: 25 };
  }
  if (!Array.isArray(AppState.feedCalculator.qty)) AppState.feedCalculator.qty = [];
  if (!Array.isArray(AppState.feedCalculator.price)) AppState.feedCalculator.price = [];

  feedComponents.forEach(([, defaultQty], i) => {
    const q = AppState.feedCalculator.qty[i];
    const p = AppState.feedCalculator.price[i];

    AppState.feedCalculator.qty[i] = Number(q ?? defaultQty);
    AppState.feedCalculator.price[i] = Number(p ?? 0);
  });

  AppState.feedCalculator.volume = Number(AppState.feedCalculator.volume ?? 25);
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

  tbody.innerHTML = feedComponents.map((c, i) => `
    <tr>
      <td>${c[0]}</td>
      <td><input class="qty" data-i="${i}" type="number" value="${AppState.feedCalculator.qty[i] ?? c[1]}"></td>
      <td><input class="price" data-i="${i}" type="number" value="${AppState.feedCalculator.price[i] ?? 0}"></td>
      <td id="sum_${i}">0</td>
    </tr>
  `).join("");

  const volEl = $("feedVolume");
  if (volEl) volEl.value = AppState.feedCalculator.volume ?? 25;

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

  if ($("feedTotal")) $("feedTotal").textContent = total.toFixed(2);
  if ($("feedPerKg")) $("feedPerKg").textContent = perKg.toFixed(2);
  if ($("feedVolumeTotal")) $("feedVolumeTotal").textContent = (perKg * vol).toFixed(2);
  
  saveAppState();
}

// ============================
//      СКЛАД (дані)
// ============================

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

    const stock = Number(AppState.warehouse.history[name] || 0);
    const min = Number(mins[key] || 0);

    if (min > 0 && stock < min) {
      warnings.push(`• ${name}: ${stock.toFixed(2)} кг (мін. ${min})`);
    }
  });

  // лотки
  const trayMin = Number(mins.empty_trays || 0);
  const trayStock = Number(AppState.warehouse.trays || 0);
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
      const stock = Number(AppState.warehouse.history[name] || 0);

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
      AppState.warehouse.history[name] = Number(AppState.warehouse.history[name] || 0) + val;

      saveWarehouse();
      renderWarehouse();
      applyWarehouseWarnings();
    });
  });

  const trayStockEl = $("trayStock");
  if (trayStockEl) {
    trayStockEl.value = AppState.warehouse.trays ?? 0;
    trayStockEl.addEventListener("change", (e) => {
      if (!warehouseEditEnabled) {
        alert("🔒 Спочатку увімкни редагування складу");
        trayStockEl.value = AppState.warehouse.trays ?? 0;
        return;
      }
      AppState.warehouse.trays = Number(e.target.value) || 0;
      saveWarehouse();
      applyWarehouseWarnings();
    });
  }

  if ($("fullTrays")) $("fullTrays").textContent = AppState.warehouse.ready ?? 0;
  if ($("reservedTrays")) $("reservedTrays").textContent = AppState.warehouse.reserved ?? 0;

  const mixHistory = $("mixHistory");
  if (mixHistory) {
    mixHistory.innerHTML =
      AppState.warehouse.history?.length
        ? "<ul>" + AppState.warehouse.history.map((x) => `<li>${x}</li>`).join("") + "</ul>"
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
      if (Number(AppState.warehouse.feed[name] || 0) < need) {
        alert(`Недостатньо компоненту: ${name}`);
        return;
      }
    }

    feedComponents.forEach(([name, need]) => {
      AppState.warehouse.feed[name] = Number(AppState.warehouse.feed[name] || 0) - need;
    });

    AppState.warehouse.history.push("Заміс: " + new Date().toLocaleString());
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

  recomputeWarehouseFromSources();
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
  saveAppState();
  validateState("after saveEggRecord");

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

function showOrders() {
  const box = document.getElementById("ordersList");
  if (box) {
    box.innerHTML = "<i>Розділ «Замовлення» у розробці</i>";
  }
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

  AppState.warehouse.ready = 0;
  AppState.warehouse.reserved = 0;

  AppState.eggs.appliedTotalTrays = AppState.eggs.totalTrays;
  
saveAppState();
  saveWarehouse();
  renderWarehouse();
  applyWarehouseWarnings();

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

function cleanupLegacyLocalStorage() {
  // старі ключі калькулятора
  for (let i = 0; i < feedComponents.length; i++) {
    localStorage.removeItem("qty_" + i);
    localStorage.removeItem("price_" + i);
  }
  // якщо використовувався старий ключ мінімумів
  localStorage.removeItem("warehouseMinimums");
}

// ============================
//      START (ОДИН РАЗ)
// ============================
document.addEventListener("DOMContentLoaded", () => {
  loadAppState();

  ensureWarehouseShape();
  ensureFeedCalculatorShape();

  eggsEditEnabled = !!AppState.ui.eggsEditEnabled;
  warehouseEditEnabled = !!AppState.ui.warehouseEditEnabled;

  recomputeEggsAccumulation();
  recomputeWarehouseFromSources();

  saveAppState();

  bindNavigation();
  restoreActivePage();

  loadFeedTable();
  renderWarehouse();
  applyWarehouseWarnings();
  renderEggsReport();

  bindMakeFeed();
  bindEggSaveButton();
  bindSettingsSaveButton();

  loadWarehouseSettingsUI();
  syncToggleButtonsUI();

  validateState("after START");
});