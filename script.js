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
  const eggsBtn = document.querySelector(`button[onclick="toggleEggsEdit()"]`);
  const whBtn = document.querySelector(`button[onclick="toggleWarehouseEdit()"]`);

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
    trays: 0,
    ready: 0,
    reserved: 0,
    history: [],
  };
  saveWarehouse();
}

function saveWarehouse() {
  localStorage.setItem("warehouse", JSON.stringify(warehouse));
}

// ============================
//  СКЛАД + ПОПЕРЕДЖЕННЯ МІНІМУМІВ
// ============================

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

function checkWarehouseMinimums() {
  const minimums = JSON.parse(localStorage.getItem("warehouseMinimums") || "{}");
  let hasWarnings = false;

  feedComponents.forEach(item => {
    const name = item[0];
    const key = getMinKeyByName(name);
    if (!key) return;

    const stock = Number(warehouse.feed[name] || 0);
    const min = Number(minimums[key] || 0);

    if (min > 0 && stock < min) {
      hasWarnings = true;
    }
  });

  return hasWarnings;
}

// ============================
//  RENDER СКЛАДУ
// ============================
function renderWarehouse() {
  const tbody = $("warehouseTable");
  if (!tbody) return;

  const minimums = JSON.parse(localStorage.getItem("warehouseMinimums") || "{}");

  tbody.innerHTML = feedComponents.map(item => {
    const name = item[0];
    const need = item[1];
    const stock = warehouse.feed[name] || 0;

    const key = getMinKeyByName(name);
    const min = Number(minimums[key]) || 0;
    const isLow = min > 0 && stock < min;

    return `
      <tr style="${isLow ? "background:#3a1c1c;color:#ffb3b3;" : ""}">
        <td>${isLow ? "⚠️ " : ""}${name}</td>
        <td><input class="addStock" data-name="${name}" type="number" value="0"></td>
        <td>${need}</td>
        <td><b>${stock.toFixed(2)}</b></td>
      </tr>
    `;
  }).join("");

  document.querySelectorAll(".addStock").forEach(inp => {
    inp.onchange = e => {
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
      applyWarehouseWarnings();
    };
  });

  const trayStockEl = $("trayStock");
  if (trayStockEl) {
    trayStockEl.value = warehouse.trays ?? 0;
    trayStockEl.onchange = e => {
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
        ? "<ul>" + warehouse.history.map(x => `<li>${x}</li>`).join("") + "</ul>"
        : "<i>Порожньо</i>";
  }

  applyWarehouseWarnings();
}

function applyWarehouseWarnings() {
  const boxId = "warehouseWarnings";
  let box = document.getElementById(boxId);

  if (!box) {
    box = document.createElement("div");
    box.id = boxId;
    box.style.margin = "10px 0";
    box.style.padding = "10px";
    box.style.borderRadius = "8px";
    box.style.background = "#3a1c1c";
    box.style.color = "#ffb3b3";
    box.style.border = "1px solid #ff6666";

    const container = document.querySelector("#page-warehouse .container");
    if (container) container.prepend(box);
  }

  const minimums = JSON.parse(localStorage.getItem("warehouseMinimums") || "{}");
  const problems = [];

  feedComponents.forEach(item => {
    const name = item[0];
    const stock = warehouse.feed[name] || 0;
    const key = getMinKeyByName(name);
    const min = Number(minimums[key]) || 0;

    if (min > 0 && stock < min) {
      problems.push(`${name}: ${stock} / мін ${min}`);
    }
  });

  if (problems.length === 0) {
    box.style.display = "none";
  } else {
    box.style.display = "block";
    box.innerHTML = `
      ⚠️ <b>Низькі залишки на складі:</b><br>
      ${problems.map(p => "• " + p).join("<br>")}
    `;
  }
}

// ============================
//  КНОПКА "ЗРОБИТИ КОРМ"
// ============================
const makeFeedBtn = $("makeFeedBtn");
if (makeFeedBtn) {
  makeFeedBtn.onclick = () => {
    for (const item of feedComponents) {
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

    warehouse.history.push("Заміс: " + new Date().toLocaleString());
    saveWarehouse();
    renderWarehouse();
  };
}

// старт
renderWarehouse();

// ============================
//      ЯЙЦЯ — накопичення + перенос + синхрон з лотками
// ============================
let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");

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
  checkWarehouseMinimums();
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
  checkWarehouseMinimums();
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
//      TOGGLE (ЯЙЦЯ / СКЛАД)
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

function clearEggTrays() {
  if (!eggsEditEnabled) {
    alert("🔒 Спочатку увімкни редагування яєць");
    return;
  }
  if (!confirm("Очистити ВСІ лотки з яйцями? (готові + резерв)")) return;

  warehouse.ready = 0;
  warehouse.reserved = 0;

  eggsCarry.appliedTotalTrays = eggsCarry.totalTrays;
  localStorage.setItem("eggsCarry", JSON.stringify(eggsCarry));

  saveWarehouse();
  renderWarehouse();
  checkWarehouseMinimums();
  showOrders();

  alert("✅ Лотки з яйцями очищено");
}
window.clearEggTrays = clearEggTrays;

// ============================
//  НАЛАШТУВАННЯ СКЛАДУ (SAFARI + CHROME SAFE)
// ============================

// --------- ЗБЕРЕГТИ ---------
function saveWarehouseSettings() {
  try {
    const data = {
      kukurudza: Number(document.getElementById("minFeed_kukurudza")?.value || 0),
      pshenytsia: Number(document.getElementById("minFeed_pshenytsia")?.value || 0),
      yachmin: Number(document.getElementById("minFeed_yachmin")?.value || 0),
      soieva_makuha: Number(document.getElementById("minFeed_soieva_makuha")?.value || 0),
      soniashnykova_makuha: Number(document.getElementById("minFeed_soniashnykova_makuha")?.value || 0),
      rybne_boroshno: Number(document.getElementById("minFeed_rybne_boroshno")?.value || 0),
      drizhdzhi: Number(document.getElementById("minFeed_drizhdzhi")?.value || 0),
      trykaltsii_fosfat: Number(document.getElementById("minFeed_trykaltsii_fosfat")?.value || 0),
      dolfos_d: Number(document.getElementById("minFeed_dolfos_d")?.value || 0),
      sil: Number(document.getElementById("minFeed_sil")?.value || 0),
      empty_trays: Number(document.getElementById("min_empty_trays")?.value || 0)
    };

    localStorage.setItem("warehouseMinimums", JSON.stringify(data));

    alert("✅ Дані успішно збережені");
  } catch (err) {
    console.error(err);
    alert("❌ Не вдалося зберегти дані");
  }
}

// --------- ЗАВАНТАЖИТИ ---------
function loadWarehouseSettings() {
  try {
    const data = JSON.parse(localStorage.getItem("warehouseMinimums") || "{}");

    if (data.kukurudza !== undefined) document.getElementById("minFeed_kukurudza").value = data.kukurudza;
    if (data.pshenytsia !== undefined) document.getElementById("minFeed_pshenytsia").value = data.pshenytsia;
    if (data.yachmin !== undefined) document.getElementById("minFeed_yachmin").value = data.yachmin;
    if (data.soieva_makuha !== undefined) document.getElementById("minFeed_soieva_makuha").value = data.soieva_makuha;
    if (data.soniashnykova_makuha !== undefined) document.getElementById("minFeed_soniashnykova_makuha").value = data.soniashnykova_makuha;
    if (data.rybne_boroshno !== undefined) document.getElementById("minFeed_rybne_boroshno").value = data.rybne_boroshno;
    if (data.drizhdzhi !== undefined) document.getElementById("minFeed_drizhdzhi").value = data.drizhdzhi;
    if (data.trykaltsii_fosfat !== undefined) document.getElementById("minFeed_trykaltsii_fosfat").value = data.trykaltsii_fosfat;
    if (data.dolfos_d !== undefined) document.getElementById("minFeed_dolfos_d").value = data.dolfos_d;
    if (data.sil !== undefined) document.getElementById("minFeed_sil").value = data.sil;
    if (data.empty_trays !== undefined) document.getElementById("min_empty_trays").value = data.empty_trays;

  } catch (err) {
    console.error(err);
  }
}

// --------- SAFARI SAFE ПІДВʼЯЗКА ---------
document.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("saveWarehouseSettingsBtn");
  if (btn) {
    btn.addEventListener("click", saveWarehouseSettings);
  }
  loadWarehouseSettings();
});


// ============================
//      СТАРТ
// ============================
document.addEventListener("DOMContentLoaded", () => {
  syncToggleButtonsUI();
  loadWarehouseSettingsUI();
});

// ============================
//      APP STATE (BASE)
// ============================

const AppState = {
  ui: {
    page: "calculator",
    eggsEditEnabled: false,
    warehouseEditEnabled: false
  },

  warehouse: {
    minimums: {}
  }
};

// завантаження зі сховища
function loadAppState() {
  try {
    const saved = JSON.parse(localStorage.getItem("AppState"));
    if (saved) {
      Object.assign(AppState, saved);
    }
  } catch (e) {
    console.warn("AppState load failed", e);
  }
}

// збереження
function saveAppState() {
  try {
    localStorage.setItem("AppState", JSON.stringify(AppState));
  } catch (e) {
    console.error("AppState save failed", e);
  }
}

// старт
document.addEventListener("DOMContentLoaded", () => {
  loadAppState();
});