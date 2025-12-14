// ============================
//      ГЛОБАЛЬНІ ПЕРЕМИКАЧІ
// ============================
let eggsEditEnabled = false;
let warehouseEditEnabled = false;

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
  document.getElementById("feedVolumeTotal").textContent = (perKg * vol).toFixed(2);
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

  tbody.innerHTML = feedComponents.map(item => {
    const name = item[0];
    return `
      <tr>
        <td>${name}</td>
        <td><input class="addStock" data-name="${name}" type="number" value="0"></td>
        <td>${item[1]}</td>
        <td>${(warehouse.feed[name]||0).toFixed(2)}</td>
      </tr>`;
  }).join("");

  document.querySelectorAll(".addStock").forEach(inp => {
    inp.onchange = e => {
      const n = e.target.dataset.name;
      const v = Number(e.target.value)||0;
      if (v>0) {
        warehouse.feed[n]=(warehouse.feed[n]||0)+v;
        saveWarehouse(); renderWarehouse();
      }
    };
  });

  document.getElementById("trayStock").value = warehouse.trays||0;
  document.getElementById("fullTrays").textContent = warehouse.ready||0;
  document.getElementById("reservedTrays").textContent = warehouse.reserved||0;
}
renderWarehouse();

// ============================
//      TOGGLE
// ============================
function toggleEggsEdit() {
  eggsEditEnabled = !eggsEditEnabled;
  alert(eggsEditEnabled
    ? "🔓 Редагування яєць УВІМКНЕНО"
    : "🔒 Редагування яєць ВИМКНЕНО");
}
window.toggleEggsEdit = toggleEggsEdit;

function toggleWarehouseEdit() {
  warehouseEditEnabled = !warehouseEditEnabled;
  alert(warehouseEditEnabled
    ? "🔓 Редагування складу УВІМКНЕНО"
    : "🔒 Редагування складу ВИМКНЕНО");
}
window.toggleWarehouseEdit = toggleWarehouseEdit;

// ============================
//      ОЧИСТКА
// ============================
function clearFeedComponents() {
  if (!warehouseEditEnabled) {
    alert("⛔ Спочатку увімкни редагування складу");
    return;
  }
  if (!confirm("Очистити ВСІ компоненти?")) return;
  warehouse.feed = {};
  saveWarehouse(); renderWarehouse();
  alert("✅ Компоненти очищено");
}
window.clearFeedComponents = clearFeedComponents;

function clearEggTrays() {
  if (!eggsEditEnabled) {
    alert("⛔ Спочатку увімкни редагування яєць");
    return;
  }
  if (!confirm("Очистити ВСІ лотки?")) return;
  warehouse.ready = 0;
  warehouse.reserved = 0;
  saveWarehouse(); renderWarehouse();
  alert("✅ Лотки очищено");
}
window.clearEggTrays = clearEggTrays;