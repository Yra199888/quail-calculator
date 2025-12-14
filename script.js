// ============================
//      ТЕМА (ніч / день)
// ============================
const themeSwitch = document.getElementById("themeSwitch");
if (themeSwitch) {
  themeSwitch.onclick = () => {
    document.body.classList.toggle("light");
    themeSwitch.textContent = document.body.classList.contains("light") ? "☀️" : "🌙";
  };
}

// ============================
//      НАВІГАЦІЯ
// ============================
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.onclick = () => {
    const page = btn.dataset.page;
    if (!page) return; // тема

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
    document.getElementById("page-" + page)?.classList.add("active-page");

    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
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
  ["Сіль", 0.05]
];

// ============================
//      КАЛЬКУЛЯТОР КОРМУ (не ламаємо)
// ============================
function loadFeedTable() {
  const tbody = document.getElementById("feedTable");
  if (!tbody) return;

  tbody.innerHTML = feedComponents.map((c, i) => `
    <tr>
      <td>${c[0]}</td>
      <td><input class="qty" data-i="${i}" type="number" value="${localStorage.getItem("qty_"+i) ?? c[1]}"></td>
      <td><input class="price" data-i="${i}" type="number" value="${localStorage.getItem("price_"+i) ?? 0}"></td>
      <td id="sum_${i}">0</td>
    </tr>
  `).join("");

  document.querySelectorAll(".qty,.price,#feedVolume")
    .forEach(el => el.oninput = calculateFeed);

  calculateFeed();
}

function calculateFeed() {
  let total = 0, totalKg = 0;

  feedComponents.forEach((_, i) => {
    const qty = Number(document.querySelector(`.qty[data-i="${i}"]`)?.value) || 0;
    const price = Number(document.querySelector(`.price[data-i="${i}"]`)?.value) || 0;

    localStorage.setItem("qty_"+i, qty);
    localStorage.setItem("price_"+i, price);

    const sum = qty * price;
    total += sum;
    totalKg += qty;

    document.getElementById("sum_"+i).textContent = sum.toFixed(2);
  });

  const perKg = totalKg ? total / totalKg : 0;
  const vol = Number(document.getElementById("feedVolume")?.value) || 0;

  document.getElementById("feedTotal").textContent = total.toFixed(2);
  document.getElementById("feedPerKg").textContent = perKg.toFixed(2);
  document.getElementById("feedVolumeTotal").textContent = (perKg * vol).toFixed(2);
}

loadFeedTable();

// ============================
//      СКЛАД
// ============================
let warehouse = JSON.parse(localStorage.getItem("warehouse") || "{}");
if (!warehouse.feed) {
  warehouse = {
    feed: {},
    trays: 0,      // пусті лотки (ручне поле)
    ready: 0,      // готові повні лотки
    reserved: 0,   // заброньовані
    history: []
  };
  saveWarehouse();
}

function saveWarehouse() {
  localStorage.setItem("warehouse", JSON.stringify(warehouse));
}

function renderWarehouse() {
  const tbody = document.getElementById("warehouseTable");
  if (!tbody) return;

  tbody.innerHTML = feedComponents.map(item => {
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
  }).join("");

  document.querySelectorAll(".addStock").forEach(inp => {
    inp.onchange = (e) => {
      const name = e.target.dataset.name;
      const val = Number(e.target.value) || 0;
      if (val > 0) {
        warehouse.feed[name] = (warehouse.feed[name] || 0) + val;
        saveWarehouse();
        renderWarehouse();
      }
    };
  });

  const trayStockEl = document.getElementById("trayStock");
  if (trayStockEl) {
    trayStockEl.value = warehouse.trays ?? 0;
    trayStockEl.onchange = (e) => {
      warehouse.trays = Number(e.target.value) || 0;
      saveWarehouse();
    };
  }

  document.getElementById("fullTrays") && (document.getElementById("fullTrays").textContent = warehouse.ready ?? 0);
  document.getElementById("reservedTrays") && (document.getElementById("reservedTrays").textContent = warehouse.reserved ?? 0);

  const mixHistory = document.getElementById("mixHistory");
  if (mixHistory) {
    mixHistory.innerHTML = (warehouse.history?.length)
      ? "<ul>" + warehouse.history.map(x => `<li>${x}</li>`).join("") + "</ul>"
      : "<i>Порожньо</i>";
  }
}

renderWarehouse();

const makeFeedBtn = document.getElementById("makeFeedBtn");
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
// appliedTotalTrays (скільки вже “додали” в warehouse.ready)
let eggsCarry = JSON.parse(localStorage.getItem("eggsCarry") || "{}");
if (typeof eggsCarry.carry !== "number") eggsCarry.carry = 0;
if (typeof eggsCarry.totalTrays !== "number") eggsCarry.totalTrays = 0;
if (typeof eggsCarry.appliedTotalTrays !== "number") eggsCarry.appliedTotalTrays = 0;

function sortDatesAsc(dates) {
  return dates.slice().sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function recomputeEggsAccumulation() {
  const dates = sortDatesAsc(Object.keys(eggs));
  let carry = 0;
  let totalTrays = 0;

  dates.forEach(d => {
    const e = eggs[d];
    const good = Number(e.good) || 0;
    const bad  = Number(e.bad) || 0;
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

  // ✅ синхронізація з warehouse.ready через ДЕЛЬТУ (щоб не дублювало при перезавантаженні)
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
  const dateInput = document.getElementById("eggsDate");
  const goodInput = document.getElementById("eggsGood");
  const badInput  = document.getElementById("eggsBad");
  const homeInput = document.getElementById("eggsHome");
  const infoBox   = document.getElementById("eggsInfo");

  if (!dateInput || !goodInput || !badInput || !homeInput) return;

  const date = dateInput.value || new Date().toISOString().slice(0, 10);

  eggs[date] = {
    good: Number(goodInput.value) || 0,
    bad:  Number(badInput.value) || 0,
    home: Number(homeInput.value) || 0
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

  document.getElementById("eggsDate").value = date;
  document.getElementById("eggsGood").value = e.good ?? 0;
  document.getElementById("eggsBad").value  = e.bad ?? 0;
  document.getElementById("eggsHome").value = e.home ?? 0;
}
window.editEgg = editEgg;

function deleteEgg(date) {
  if (!eggs[date]) return;
  delete eggs[date];
  recomputeEggsAccumulation();
  renderEggsReport();
}
window.deleteEgg = deleteEgg;

function clearAllEggs() {
  if (!confirm("Видалити ВЕСЬ щоденний звіт по яйцях?")) return;

  eggs = {};
  eggsCarry = { carry: 0, totalTrays: 0, appliedTotalTrays: eggsCarry.appliedTotalTrays || 0 };

  localStorage.setItem("eggs", JSON.stringify(eggs));
  localStorage.setItem("eggsCarry", JSON.stringify(eggsCarry));

  // Після очистки треба перерахувати і зняти лотки (дельта стане від’ємною і відкоригує ready)
  recomputeEggsAccumulation();
  renderEggsReport();

  const infoBox = document.getElementById("eggsInfo");
  if (infoBox) infoBox.innerHTML = "";
}
window.clearAllEggs = clearAllEggs;

function renderEggsReport() {
  const list = document.getElementById("eggsList");
  if (!list) return;

  const dates = Object.keys(eggs).sort().reverse();
  if (dates.length === 0) {
    list.innerHTML = "<i>Записів немає</i>";
    return;
  }

  list.innerHTML = dates.map(d => {
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
  }).join("");
}

// старт
recomputeEggsAccumulation();
renderEggsReport();

// ============================
//      ЗАМОВЛЕННЯ
// ============================
let orders = JSON.parse(localStorage.getItem("orders") || "{}");

function addOrder() {
  const d = document.getElementById("orderDate")?.value || new Date().toISOString().slice(0, 10);
  const name = document.getElementById("orderName")?.value || "Без імені";
  const trays = Number(document.getElementById("orderTrays")?.value) || 0;
  const details = document.getElementById("orderDetails")?.value || "";

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
  const box = document.getElementById("ordersList");
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

  Object.keys(orders).sort().reverse().forEach(date => {
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
//      ФІНАНСИ (заглушки, щоб не ламало)
// ============================
function saveFinanceSettings() { alert("Фінанси: ще в розробці 🙂"); }
function exportCSV() { alert("Експорт: ще в розробці 🙂"); }
window.saveFinanceSettings = saveFinanceSettings;
window.exportCSV = exportCSV;

// ============================
//   ОЧИСТКА СКЛАДУ
// ============================

// Очистити ВСІ кормові компоненти
function clearFeedComponents() {
    if (!confirm("Очистити ВСІ кормові компоненти на складі?")) return;

    warehouse.feed = {};
    saveWarehouse();
    renderWarehouse();
}
window.clearFeedComponents = clearFeedComponents;


// Очистити лотки з яйцями (готові + резерв)
function clearEggTrays() {
    if (!confirm("Очистити ВСІ лотки з яйцями?")) return;

    warehouse.ready = 0;
    warehouse.reserved = 0;

    saveWarehouse();
    renderWarehouse();
    showOrders(); // щоб одразу оновився стан у замовленнях
}
window.clearEggTrays = clearEggTrays;
