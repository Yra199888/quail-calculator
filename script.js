// ============================
//      ТЕМА (ніч / день)
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

    document.querySelectorAll(".page")
      .forEach(p => p.classList.remove("active-page"));

    document.getElementById("page-" + page)
      ?.classList.add("active-page");

    document.querySelectorAll(".nav-btn")
      .forEach(b => b.classList.remove("active"));

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
//      КАЛЬКУЛЯТОР КОРМУ
// ============================
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
  document.getElementById("feedVolumeTotal").textContent =
    (perKg * vol).toFixed(2);
}

loadFeedTable();

// ============================
//      СКЛАД
// ============================
let warehouse = JSON.parse(localStorage.getItem("warehouse") || "{}");
if (!warehouse.feed) {
  warehouse = { feed:{}, trays:0, ready:0, reserved:0, history:[] };
  saveWarehouse();
}

function saveWarehouse() {
  localStorage.setItem("warehouse", JSON.stringify(warehouse));
}

function renderWarehouse() {
  const tbody = document.getElementById("warehouseTable");
  if (!tbody) return;

  tbody.innerHTML = feedComponents.map(item => `
    <tr>
      <td>${item[0]}</td>
      <td><input class="addStock" data-name="${item[0]}" type="number" value="0"></td>
      <td>${item[1]}</td>
      <td>${(warehouse.feed[item[0]]||0).toFixed(2)}</td>
    </tr>
  `).join("");

  document.querySelectorAll(".addStock").forEach(inp => {
    inp.onchange = e => {
      if (!warehouseEditEnabled) {
        alert("🔒 Увімкни редагування складу");
        e.target.value = 0;
        return;
      }
      const name = e.target.dataset.name;
      const val = Number(e.target.value)||0;
      warehouse.feed[name]=(warehouse.feed[name]||0)+val;
      saveWarehouse(); renderWarehouse();
    };
  });

  document.getElementById("trayStock").value = warehouse.trays;
  document.getElementById("trayStock").onchange = e=>{
    if(!warehouseEditEnabled){ alert("🔒 Увімкни редагування складу"); return; }
    warehouse.trays = Number(e.target.value)||0;
    saveWarehouse();
  };

  document.getElementById("fullTrays").textContent = warehouse.ready;
  document.getElementById("reservedTrays").textContent = warehouse.reserved;
}

renderWarehouse();

// ============================
//      ЯЙЦЯ
// ============================
let eggs = JSON.parse(localStorage.getItem("eggs")||"{}");

function saveEggRecord(){
  const d=eggsDate.value||new Date().toISOString().slice(0,10);
  eggs[d]={ good:+eggsGood.value||0, bad:+eggsBad.value||0, home:+eggsHome.value||0 };
  localStorage.setItem("eggs",JSON.stringify(eggs));
  renderEggs();
}
window.saveEggRecord=saveEggRecord;

function renderEggs(){
  const list=document.getElementById("eggsList");
  list.innerHTML=Object.keys(eggs).sort().reverse().map(d=>{
    const e=eggs[d];
    return `<div class="egg-entry"><b>${d}</b><br>
    Яєць:${e.good} | Брак:${e.bad} | Дім:${e.home}</div>`;
  }).join("")||"<i>Записів немає</i>";
}
renderEggs();

// ============================
//      ЗАМОВЛЕННЯ
// ============================
let orders=JSON.parse(localStorage.getItem("orders")||"{}");

function addOrder(){
  const d=orderDate.value||new Date().toISOString().slice(0,10);
  if(!orders[d])orders[d]=[];
  orders[d].push({
    name:orderName.value||"Без імені",
    trays:+orderTrays.value||0,
    details:orderDetails.value||"",
    status:"активне"
  });
  warehouse.reserved+=+orderTrays.value||0;
  saveWarehouse();
  localStorage.setItem("orders",JSON.stringify(orders));
  showOrders(); renderWarehouse();
}
window.addOrder=addOrder;

function showOrders(){
  const box=document.getElementById("ordersList");
  box.innerHTML="";
  Object.keys(orders).sort().reverse().forEach(d=>{
    box.innerHTML+=`<h3>${d}</h3>`;
    orders[d].forEach(o=>{
      box.innerHTML+=`<div>${o.name} — ${o.trays} лотків (${o.status})</div>`;
    });
  });
}
showOrders();

// ============================
//      ФІНАНСИ
// ============================
function saveFinanceSettings(){ alert("Фінанси збережено"); }
function exportCSV(){ alert("CSV експорт"); }
window.saveFinanceSettings=saveFinanceSettings;
window.exportCSV=exportCSV;

// ============================
//      TOGGLE З ІНДИКАТОРАМИ
// ============================
let eggsEditEnabled=false;
let warehouseEditEnabled=false;

function updateToggle(btn, enabled){
  btn.textContent = enabled ? "🔓 Редагування УВІМКНЕНО" : "🔒 Редагування ВИМКНЕНО";
  btn.style.background = enabled ? "#8b0000" : "#1f7a1f";
}

function toggleEggsEdit(){
  eggsEditEnabled=!eggsEditEnabled;
  updateToggle(event.target,eggsEditEnabled);
}
window.toggleEggsEdit=toggleEggsEdit;

function toggleWarehouseEdit(){
  warehouseEditEnabled=!warehouseEditEnabled;
  updateToggle(event.target,warehouseEditEnabled);
}
window.toggleWarehouseEdit=toggleWarehouseEdit;

// ============================
//      ОЧИСТКА
// ============================
function clearFeedComponents(){
  if(!warehouseEditEnabled){ alert("🔒 Увімкни редагування складу"); return; }
  if(!confirm("Очистити компоненти?"))return;
  warehouse.feed={}; saveWarehouse(); renderWarehouse();
}
window.clearFeedComponents=clearFeedComponents;

function clearEggTrays(){
  if(!eggsEditEnabled){ alert("🔒 Увімкни редагування яєць"); return; }
  if(!confirm("Очистити лотки?"))return;
  warehouse.ready=0; warehouse.reserved=0;
  saveWarehouse(); renderWarehouse(); showOrders();
}
window.clearEggTrays=clearEggTrays;