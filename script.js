/*****************************
 *  ТЕМА
 *****************************/
const themeSwitch = document.getElementById("themeSwitch");
if (themeSwitch) {
  themeSwitch.onclick = () => {
    document.body.classList.toggle("light");
    themeSwitch.textContent =
      document.body.classList.contains("light") ? "☀️" : "🌙";
  };
}

/*****************************
 *  НАВІГАЦІЯ
 *****************************/
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.onclick = () => {
    const page = btn.dataset.page;
    if (!page) return;

    document.querySelectorAll(".page").forEach(p =>
      p.classList.remove("active-page")
    );

    document.getElementById("page-" + page)?.classList.add("active-page");

    document.querySelectorAll(".nav-btn").forEach(b =>
      b.classList.remove("active")
    );
    btn.classList.add("active");
  };
});

/*****************************
 *  СКЛАД
 *****************************/
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

/*****************************
 *  ЯЙЦЯ (ГОЛОВНЕ)
 *****************************/
let eggs = JSON.parse(localStorage.getItem("eggs")) || {};
let eggBalance = Number(localStorage.getItem("eggBalance")) || 0;

function saveEggRecord() {
  const date = eggsDate.value || new Date().toISOString().slice(0, 10);
  const good = Number(eggsGood.value) || 0;
  const bad = Number(eggsBad.value) || 0;
  const home = Number(eggsHome.value) || 0;

  const commercialToday = Math.max(good - bad - home, 0);

  // 🔥 головна математика
  const totalEggs = eggBalance + commercialToday;
  const newTrays = Math.floor(totalEggs / 20);
  const newRemainder = totalEggs % 20;

  // зберігаємо день
  eggs[date] = {
    good,
    bad,
    home,
    commercial: commercialToday,
    fromPrev: eggBalance,
    total: totalEggs,
    trays: newTrays,
    remainder: newRemainder
  };

  // 🔥 оновлюємо баланс
  eggBalance = newRemainder;
  localStorage.setItem("eggBalance", eggBalance);

  // 🔥 додаємо лотки на склад
  warehouse.ready += newTrays;
  saveWarehouse();

  localStorage.setItem("eggs", JSON.stringify(eggs));

  eggsInfo.innerHTML =
    newTrays > 0
      ? `📦 Вільних лотків: <b>${warehouse.ready}</b>, залишок <b>${eggBalance}</b> яєць`
      : `🥚 ${totalEggs} яєць (до лотка бракує ${20 - totalEggs})`;

  renderEggsReport();
  renderWarehouseCounters();
}

/*****************************
 *  ЗВІТ ПО ЯЙЦЯХ
 *****************************/
function renderEggsReport() {
  eggsList.innerHTML = "";

  Object.keys(eggs)
    .sort()
    .reverse()
    .forEach(d => {
      const e = eggs[d];
      eggsList.innerHTML += `
      <div class="egg-entry">
        <b>${d}</b><br>
        Всього: ${e.good} | Брак: ${e.bad} | Для дому: ${e.home}<br>
        Комерційні: ${e.commercial}<br>
        Перенос: ${e.fromPrev} → Разом: ${e.total}<br>
        Лотки: ${e.trays} | Залишок: ${e.remainder}
      </div>`;
    });
}

/*****************************
 *  СКЛАД (ЛИШЕ ЛОТКИ)
 *****************************/
function renderWarehouseCounters() {
  document.getElementById("fullTrays").textContent = warehouse.ready;
  document.getElementById("reservedTrays").textContent = warehouse.reserved;
}

/*****************************
 *  ЗАМОВЛЕННЯ
 *****************************/
let orders = JSON.parse(localStorage.getItem("orders")) || {};

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
  renderWarehouseCounters();
}

function setStatus(d, i, s) {
  const o = orders[d][i];
  if (!o) return;

  if (o.status === "активне") {
    if (s === "виконано") {
      warehouse.reserved -= o.trays;
      warehouse.ready -= o.trays;
    }
    if (s === "скасовано") {
      warehouse.reserved -= o.trays;
    }
  }

  o.status = s;
  saveWarehouse();
  localStorage.setItem("orders", JSON.stringify(orders));
  showOrders();
  renderWarehouseCounters();
}

function showOrders() {
  ordersList.innerHTML = `
    <div>
      <b>Вільні лотки:</b> ${warehouse.ready - warehouse.reserved}
    </div>
  `;

  Object.keys(orders)
    .sort()
    .reverse()
    .forEach(d => {
      ordersList.innerHTML += `<h3>${d}</h3>`;
      orders[d].forEach((o, i) => {
        ordersList.innerHTML += `
        <div>
          <b>${o.name}</b> — ${o.trays} (${o.status})<br>
          ${o.details}<br>
          <button onclick="setStatus('${d}',${i},'виконано')">✅</button>
          <button onclick="setStatus('${d}',${i},'скасовано')">❌</button>
        </div>`;
      });
    });
}

/*****************************
 *  INIT
 *****************************/
renderEggsReport();
renderWarehouseCounters();
showOrders();