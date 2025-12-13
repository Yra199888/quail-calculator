// ============================
//      ТЕМА
// ============================
const themeSwitch = document.getElementById("themeSwitch");
if (themeSwitch) {
  themeSwitch.onclick = () => {
    document.body.classList.toggle("light");
    themeSwitch.textContent =
      document.body.classList.contains("light") ? "☀️" : "🌙";
  };
}

// ============================
//      НАВІГАЦІЯ
// ============================
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.onclick = () => {
    const page = btn.dataset.page;
    if (!page) return;

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
    document.getElementById("page-" + page)?.classList.add("active-page");

    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  };
});

// ============================
//      КОРМ
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
//      СКЛАД
// ============================
let warehouse = JSON.parse(localStorage.getItem("warehouse") || "{}");
if (!warehouse.ready) {
  warehouse = { feed:{}, trays:0, ready:0, reserved:0, history:[] };
}
function saveWarehouse() {
  localStorage.setItem("warehouse", JSON.stringify(warehouse));
}

// ============================
//      ЯЙЦЯ (ГОЛОВНА ЛОГІКА)
// ============================
let eggs = JSON.parse(localStorage.getItem("eggs") || "{}");

function recalcEggs() {
  const dates = Object.keys(eggs).sort();
  let carry = 0;
  let totalTrays = 0;

  dates.forEach(d => {
    const e = eggs[d];
    const commercial = Math.max((e.good||0) - (e.bad||0) - (e.home||0), 0);
    const sum = carry + commercial;
    const trays = Math.floor(sum / 20);
    const remainder = sum % 20;

    e.commercial = commercial;
    e.sum = sum;
    e.trays = trays;
    e.remainder = remainder;
    e.carryIn = carry;

    carry = remainder;
    totalTrays += trays;
  });

  warehouse.ready = Math.max(totalTrays, warehouse.reserved);
  saveWarehouse();
}

function saveEggRecord() {
  const date = eggsDate.value || new Date().toISOString().slice(0,10);

  eggs[date] = {
    good: Number(eggsGood.value)||0,
    bad: Number(eggsBad.value)||0,
    home: Number(eggsHome.value)||0
  };

  localStorage.setItem("eggs", JSON.stringify(eggs));
  recalcEggs();
  renderEggs();
  renderWarehouse();
}
window.saveEggRecord = saveEggRecord;

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
  localStorage.setItem("eggs", JSON.stringify(eggs));
  recalcEggs();
  renderEggs();
  renderWarehouse();
}
window.deleteEgg = deleteEgg;

function clearEggsReport() {
  eggs = {};
  localStorage.removeItem("eggs");
  warehouse.ready = warehouse.reserved;
  saveWarehouse();
  renderEggs();
  renderWarehouse();
}
window.clearEggsReport = clearEggsReport;

function renderEggs() {
  const box = document.getElementById("eggsList");
  if (!box) return;

  const dates = Object.keys(eggs).sort().reverse();
  if (!dates.length) {
    box.innerHTML = "<i>Записів немає</i>";
    return;
  }

  box.innerHTML = dates.map(d => {
    const e = eggs[d];
    return `
      <div class="egg-entry">
        <b>${d}</b>
        <button onclick="editEgg('${d}')">✏️</button>
        <button onclick="deleteEgg('${d}')">🗑️</button><br>
        Всього: ${e.good}, Брак: ${e.bad}, Для дому: ${e.home}<br>
        Перенос: ${e.carryIn} → Разом: ${e.sum}<br>
        Лотки: <b>${e.trays}</b>, Залишок: <b>${e.remainder}</b>
      </div>
    `;
  }).join("");
}

// ============================
//      ЗАМОВЛЕННЯ
// ============================
let orders = JSON.parse(localStorage.getItem("orders") || "{}");

function addOrder() {
  const d = orderDate.value || new Date().toISOString().slice(0,10);
  const trays = Number(orderTrays.value)||0;
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

function setStatus(d,i,s) {
  const o = orders[d][i];
  if (o.status === "активне") {
    warehouse.reserved -= o.trays;
    if (s === "виконано") {
      warehouse.ready = Math.max(warehouse.ready - o.trays, warehouse.reserved);
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

  const free = Math.max(warehouse.ready - warehouse.reserved,0);
  let html = `<b>Вільні:</b> ${free} | <b>Замовлено:</b> ${warehouse.reserved}<br>`;

  Object.keys(orders).sort().reverse().forEach(d=>{
    html+=`<h3>${d}</h3>`;
    orders[d].forEach((o,i)=>{
      html+=`
        <div>
          ${o.name} — ${o.trays} (${o.status})<br>
          <button onclick="setStatus('${d}',${i},'виконано')">✅</button>
          <button onclick="setStatus('${d}',${i},'скасовано')">❌</button>
        </div>`;
    });
  });

  box.innerHTML = html;
}

// ============================
//      СТАРТ
// ============================
recalcEggs();
renderEggs();
showOrders();
renderWarehouse();