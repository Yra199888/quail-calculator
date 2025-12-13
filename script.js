/*************************************************
 * ТЕМА
 *************************************************/
const themeSwitch = document.getElementById("themeSwitch");
if (themeSwitch) {
  themeSwitch.onclick = () => {
    document.body.classList.toggle("light");
    themeSwitch.textContent =
      document.body.classList.contains("light") ? "☀️" : "🌙";
  };
}

/*************************************************
 * НАВІГАЦІЯ
 *************************************************/
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.onclick = () => {
    const page = btn.dataset.page;
    if (!page) return;

    document.querySelectorAll(".page")
      .forEach(p => p.classList.remove("active-page"));

    document.getElementById("page-" + page)?.classList.add("active-page");

    document.querySelectorAll(".nav-btn")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");
  };
});

/*************************************************
 * КОРМ — КОМПОНЕНТИ
 *************************************************/
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

/*************************************************
 * КАЛЬКУЛЯТОР КОРМУ — 100% стабільний
 *************************************************/
function loadFeedTable() {
  const tbody = document.getElementById("feedTable");
  if (!tbody) return;

  tbody.innerHTML = feedComponents.map((c, i) => `
    <tr>
      <td>${c[0]}</td>
      <td><input class="qty" data-i="${i}" type="number"
          value="${localStorage.getItem("qty_"+i) ?? c[1]}"></td>
      <td><input class="price" data-i="${i}" type="number"
          value="${localStorage.getItem("price_"+i) ?? 0}"></td>
      <td id="sum_${i}">0</td>
    </tr>
  `).join("");

  document.querySelectorAll(".qty, .price, #feedVolume")
    .forEach(i => i.oninput = calculateFeed);

  calculateFeed();
}

function calculateFeed() {
  let total = 0, kg = 0;

  feedComponents.forEach((_, i) => {
    const q = +document.querySelector(`.qty[data-i="${i}"]`)?.value || 0;
    const p = +document.querySelector(`.price[data-i="${i}"]`)?.value || 0;

    localStorage.setItem("qty_"+i, q);
    localStorage.setItem("price_"+i, p);

    const s = q * p;
    total += s;
    kg += q;

    document.getElementById("sum_"+i).textContent = s.toFixed(2);
  });

  const perKg = kg ? total / kg : 0;
  const vol = +document.getElementById("feedVolume")?.value || 0;

  document.getElementById("feedTotal").textContent = total.toFixed(2);
  document.getElementById("feedPerKg").textContent = perKg.toFixed(2);
  document.getElementById("feedVolumeTotal").textContent = (perKg * vol).toFixed(2);
}

loadFeedTable();

/*************************************************
 * СКЛАД
 *************************************************/
let warehouse = JSON.parse(localStorage.getItem("warehouse")) || {
  feed: {},
  trays: 0,
  ready: 0,
  reserved: 0,
  history: []
};

function saveWarehouse() {
  localStorage.setItem("warehouse", JSON.stringify(warehouse));
}

function renderWarehouse() {
  const tbody = document.getElementById("warehouseTable");
  if (!tbody) return;

  tbody.innerHTML = feedComponents.map(c => `
    <tr>
      <td>${c[0]}</td>
      <td><input class="addStock" data-name="${c[0]}" type="number" value="0"></td>
      <td>${c[1]}</td>
      <td>${(warehouse.feed[c[0]] || 0).toFixed(2)}</td>
    </tr>
  `).join("");

  document.querySelectorAll(".addStock").forEach(i => {
    i.onchange = e => {
      const n = e.target.dataset.name;
      const v = +e.target.value || 0;
      if (v > 0) {
        warehouse.feed[n] = (warehouse.feed[n] || 0) + v;
        saveWarehouse();
        renderWarehouse();
      }
    };
  });

  trayStock.value = warehouse.trays;
  fullTrays.textContent = warehouse.ready;
  reservedTrays.textContent = warehouse.reserved;
}

renderWarehouse();

/*************************************************
 * ЯЙЦЯ — НАКОПИЧУВАЛЬНА ЛОГІКА (ГОЛОВНЕ)
 *************************************************/
let eggs = JSON.parse(localStorage.getItem("eggs")) || {};

function recomputeEggs() {
  const dates = Object.keys(eggs).sort();
  let carry = 0;
  let producedTrays = 0;

  dates.forEach(d => {
    const e = eggs[d];
    const commercial = Math.max(e.good - e.bad - e.home, 0);
    const sum = carry + commercial;
    const trays = Math.floor(sum / 20);
    carry = sum % 20;

    e.commercial = commercial;
    e.trays = trays;
    e.remainder = carry;

    producedTrays += trays;
  });

  warehouse.ready = Math.max(producedTrays, warehouse.reserved);
  saveWarehouse();
  localStorage.setItem("eggs", JSON.stringify(eggs));
  renderWarehouse();
}

function saveEggRecord() {
  const d = eggsDate.value || new Date().toISOString().slice(0,10);
  eggs[d] = {
    good: +eggsGood.value || 0,
    bad: +eggsBad.value || 0,
    home: +eggsHome.value || 0
  };

  recomputeEggs();
  renderEggs();
}

window.saveEggRecord = saveEggRecord;

function renderEggs() {
  eggsList.innerHTML = Object.keys(eggs).sort().reverse().map(d => {
    const e = eggs[d];
    return `
      <div class="egg-entry">
        <b>${d}</b><br>
        Всього: ${e.good} | Брак: ${e.bad} | Для дому: ${e.home}<br>
        Лотки: <b>${e.trays}</b> | Залишок: <b>${e.remainder}</b>
        <br>
        <button onclick="editEgg('${d}')">✏️</button>
        <button onclick="deleteEgg('${d}')">🗑️</button>
      </div>
    `;
  }).join("");
}

function editEgg(d) {
  const e = eggs[d];
  eggsDate.value = d;
  eggsGood.value = e.good;
  eggsBad.value = e.bad;
  eggsHome.value = e.home;
}
window.editEgg = editEgg;

function deleteEgg(d) {
  delete eggs[d];
  recomputeEggs();
  renderEggs();
}
window.deleteEgg = deleteEgg;

function clearEggsReport() {
  eggs = {};
  recomputeEggs();
  renderEggs();
}
window.clearEggsReport = clearEggsReport;

recomputeEggs();
renderEggs();

/*************************************************
 * ЗАМОВЛЕННЯ
 *************************************************/
let orders = JSON.parse(localStorage.getItem("orders")) || {};

function addOrder() {
  const d = orderDate.value || new Date().toISOString().slice(0,10);
  if (!orders[d]) orders[d] = [];

  const t = +orderTrays.value || 0;
  orders[d].push({
    name: orderName.value || "Без імені",
    trays: t,
    details: orderDetails.value || "",
    status: "активне"
  });

  warehouse.reserved += t;
  saveWarehouse();
  localStorage.setItem("orders", JSON.stringify(orders));
  showOrders();
  renderWarehouse();
}
window.addOrder = addOrder;

function setStatus(d, i, s) {
  const o = orders[d][i];
  if (o.status === "активне") {
    warehouse.reserved -= o.trays;
    if (s === "виконано") warehouse.ready -= o.trays;
  }
  o.status = s;
  saveWarehouse();
  localStorage.setItem("orders", JSON.stringify(orders));
  showOrders();
  renderWarehouse();
}
window.setStatus = setStatus;

function showOrders() {
  ordersList.innerHTML = `
    <div><b>Вільні:</b> ${Math.max(warehouse.ready - warehouse.reserved,0)}</div>
  ` + Object.keys(orders).sort().reverse().map(d => `
    <h3>${d}</h3>
    ${orders[d].map((o,i)=>`
      <div>
        ${o.name} — ${o.trays} (${o.status})
        <button onclick="setStatus('${d}',${i},'виконано')">✅</button>
        <button onclick="setStatus('${d}',${i},'скасовано')">❌</button>
      </div>`).join("")}
  `).join("");
}

showOrders();