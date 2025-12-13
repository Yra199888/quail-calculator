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
    if (!page) return; // кнопка теми

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
if (!warehouse.feed) {
  warehouse = {
    feed: {},
    trays: 0,       // пусті лотки (ручний облік, якщо хочеш)
    ready: 0,       // повні готові лотки (накопичувальні)
    reserved: 0,    // заброньовані лотки
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

  const trayStockEl = document.getElementById("trayStock");
  if (trayStockEl) trayStockEl.value = warehouse.trays;

  const fullTraysEl = document.getElementById("fullTrays");
  const reservedTraysEl = document.getElementById("reservedTrays");
  if (fullTraysEl) fullTraysEl.textContent = warehouse.ready;
  if (reservedTraysEl) reservedTraysEl.textContent = warehouse.reserved;

  const mixHistory = document.getElementById("mixHistory");
  if (mixHistory) {
    mixHistory.innerHTML = (warehouse.history?.length)
      ? "<ul>" + warehouse.history.map(x => `<li>${x}</li>`).join("") + "</ul>"
      : "<i>Порожньо</i>";
  }
}

renderWarehouse();

// ============================
//      ЯЙЦЯ — накопичення залишку
// ============================
let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");

// Зберігаємо загальну “математику” накопичення
let eggsCarry = JSON.parse(localStorage.getItem("eggsCarry") || "{}");
if (typeof eggsCarry.carry !== "number") eggsCarry.carry = 0;        // яйця на залишку (накопичувальні)
if (typeof eggsCarry.totalTrays !== "number") eggsCarry.totalTrays = 0; // всього лотків зроблено (накопичувально)

// Допоміжне: ISO date sort
function sortDatesAsc(dates) {
  return dates.slice().sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function recomputeEggsAccumulation() {
  // Перерахунок всіх днів по порядку (залишок переноситься)
  const dates = sortDatesAsc(Object.keys(eggs));
  let carry = 0;
  let totalTrays = 0;

  dates.forEach(d => {
    const e = eggs[d];
    const commercial = Math.max((Number(e.good) || 0) - (Number(e.bad) || 0) - (Number(e.home) || 0), 0);

    const sum = carry + commercial;
    const trays = Math.floor(sum / 20);
    const remainder = sum % 20;

    e.commercial = commercial;
    e.trays = trays;           // скільки лотків “вийшло” на цьому дні з урахуванням переносу
    e.remainder = remainder;   // залишок після цього дня
    e.carryIn = carry;         // скільки зайшло з попереднього дня
    e.sum = sum;               // carry + commercial

    totalTrays += trays;
    carry = remainder;
  });

  const oldTotal = eggsCarry.totalTrays || 0;
  const newTotal = totalTrays;

  // Дельта лотків: якщо відредагував/видалив день — не дублюємо!
  const deltaTrays = newTotal - oldTotal;

  // Оновлюємо склад готових лотків через ДЕЛЬТУ
  // (щоб не з’їдати виконані замовлення — ми тут не чіпаємо orders, тільки факт виробництва)
  if (deltaTrays !== 0) {
    // якщо зменшили виробництво, але лотків вже заброньовано/віддано — не даємо піти в мінус
    const minReadyAllowed = Math.max(warehouse.reserved, 0);
    const proposed = warehouse.ready + deltaTrays;

    warehouse.ready = Math.max(proposed, minReadyAllowed);
  }

  eggsCarry.carry = carry;
  eggsCarry.totalTrays = newTotal;

  localStorage.setItem("eggs", JSON.stringify(eggs));
  localStorage.setItem("eggsCarry", JSON.stringify(eggsCarry));
  saveWarehouse();
  renderWarehouse();
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

  // Головний перерахунок накопичення
  recomputeEggsAccumulation();

  // Інфо саме по цьому дню
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

// зробити доступним для onclick
window.saveEggRecord = saveEggRecord;

function editEgg(date) {
  const e = eggs[date];
  if (!e) return;
  const dateInput = document.getElementById("eggsDate");
  const goodInput = document.getElementById("eggsGood");
  const badInput  = document.getElementById("eggsBad");
  const homeInput = document.getElementById("eggsHome");
  if (!dateInput || !goodInput || !badInput || !homeInput) return;

  dateInput.value = date;
  goodInput.value = e.good ?? 0;
  badInput.value  = e.bad ?? 0;
  homeInput.value = e.home ?? 0;
}
window.editEgg = editEgg;

function deleteEgg(date) {
  if (!eggs[date]) return;
  delete eggs[date];
  recomputeEggsAccumulation();
  renderEggsReport();
}
window.deleteEgg = deleteEgg;

function clearEggsReport() {
  eggs = {};
  eggsCarry = { carry: 0, totalTrays: 0 };
  localStorage.setItem("eggs", JSON.stringify(eggs));
  localStorage.setItem("eggsCarry", JSON.stringify(eggsCarry));
  // НЕ обнуляю warehouse.ready тут автоматом, бо можуть бути замовлення/резерв.
  // Якщо хочеш — скажеш, зробимо кнопку “обнулити склад готових лотків”.
  renderEggsReport();
}
window.clearEggsReport = clearEggsReport;

function renderEggsReport() {
  const list = document.getElementById("eggsList");
  if (!list) return;

  const dates = Object.keys(eggs).sort().reverse();
  if (dates.length === 0) {
    list.innerHTML = "<i>Записів немає</i>";
    return;
  }

  let html = "";
  dates.forEach(d => {
    const e = eggs[d];
    html += `
      <div class="egg-entry">
        <div style="display:flex; justify-content:space-between; gap:10px;">
          <b>${d}</b>
          <div style="display:flex; gap:8px;">
            <button onclick="editEgg('${d}')">✏️</button>
            <button onclick="deleteEgg('${d}')">🗑️</button>
          </div>
        </div>
        Всього: ${e.good} | Брак: ${e.bad} | Для дому: ${e.home}<br>
        Комерційні: ${e.commercial ?? 0}<br>
        Перенос з учора: ${e.carryIn ?? 0} → Разом: ${e.sum ?? 0}<br>
        Лотки: <b>${e.trays ?? 0}</b> | Залишок: <b>${e.remainder ?? 0}</b>
      </div>`;
  });

  list.innerHTML = html;
}

// стартовий перерахунок (на випадок старих записів)
recomputeEggsAccumulation();
renderEggsReport();

// ============================
//      ЗАМОВЛЕННЯ
// ============================
let orders = JSON.parse(localStorage.getItem("orders") || "{}");

function addOrder() {
  const d = orderDate.value || new Date().toISOString().slice(0, 10);
  const trays = Number(orderTrays.value) || 0;

  if (!orders[d]) orders[d] = [];
  orders[d].push({
    name: orderName.value || "Без імені",
    trays,
    details: orderDetails.value || "",
    status: "активне"
  });

  warehouse.reserved += trays;
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
      warehouse.reserved -= o.trays;
      // не даємо готовим лоткам піти нижче резерву
      warehouse.ready = Math.max(warehouse.ready - o.trays, warehouse.reserved);
    }
    if (s === "скасовано") {
      warehouse.reserved -= o.trays;
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

  const free = Math.max(warehouse.ready - warehouse.reserved, 0);

  let html = `
    <div style="background:#111; border:1px solid #222; padding:10px; border-radius:10px; margin:10px 0;">
      <b>Вільні лотки:</b> ${free} |
      <b>Замовлено:</b> ${warehouse.reserved} |
      <b>Готові:</b> ${warehouse.ready}
    </div>`;

  Object.keys(orders).sort().reverse().forEach(d => {
    html += `<h3>${d}</h3>`;
    orders[d].forEach((o, i) => {
      html += `
        <div style="background:#131313; border:1px solid #222; padding:12px; border-radius:10px; margin:10px 0;">
          <b>${o.name}</b> — ${o.trays} лотків (<b>${o.status}</b>)<br>
          ${o.details ? o.details + "<br>" : ""}
          <button onclick="setStatus('${d}',${i},'виконано')">✅ Виконано</button>
          <button onclick="setStatus('${d}',${i},'скасовано')">❌ Скасовано</button>
        </div>`;
    });
  });

  box.innerHTML = html;
}

showOrders();