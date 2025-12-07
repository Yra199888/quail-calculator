// =======================
//   GLOBAL STORAGE
// =======================

let STATE = {
    feed: {
        recipe: [],
        stock: [],
        batchKg: 25,
        dailyPerHen: 30,
        readyStock: 0
    },

    eggs: {
        total: 0,
        bad: 0,
        own: 0,
        carry: 0,
        hens1: 0,
        hens2: 0
    },

    orders: [],
    logs: [],
    incubations: [],
    clients: []
};

// ---- Автозавантаження з localStorage
if (localStorage.getItem("quailData")) {
    STATE = JSON.parse(localStorage.getItem("quailData"));
}

// ---- Автозбереження
function save() {
    localStorage.setItem("quailData", JSON.stringify(STATE));
}

// =======================
//     TAB SWITCHER
// =======================

function showPage(id) {
    document.querySelectorAll(".m3-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".m3-card").forEach(s => s.style.display = "none");

    document.querySelector(`.m3-tab[onclick="showPage('${id}')"]`).classList.add("active");

    document.querySelectorAll(`#sec-${id}, #${id}, .${id}`).forEach(el => {
        el.style.display = "block";
    });
}

function recalcEggsBalance() {
    let t = +document.getElementById("eggsTotal").value;
    let b = +document.getElementById("eggsBad").value;
    let o = +document.getElementById("eggsOwn").value;
    let c = +document.getElementById("eggsCarry").value;
    let price = +document.getElementById("trayPrice").value;

    let forSaleToday = t - b - o;
    let totalForSale = forSaleToday + c;

    let trays = Math.floor(totalForSale / 20);
    let remainder = totalForSale % 20;

    document.getElementById("eggsForSale").innerText = forSaleToday;
    document.getElementById("eggsForSaleTotal").innerText = totalForSale;
    document.getElementById("traysCount").innerText = trays;
    document.getElementById("eggsRemainder").innerText = remainder;

    document.getElementById("income").innerText = (trays * price).toFixed(2);

    // Для секції 2.3
    document.getElementById("totalTraysTodayLabel").innerText = trays;

    save();
}

function recalcProductivity() {
    let h1 = +document.getElementById("hens1").value;
    let h2 = +document.getElementById("hens2").value;
    let totalHens = h1 + h2;

    let eggsToday = +document.getElementById("eggsTotal").value;
    let bad = +document.getElementById("eggsBad").value;
    let own = +document.getElementById("eggsOwn").value;

    let useful = eggsToday - bad - own;

    document.getElementById("hensTotal").innerText = totalHens;

    if (totalHens > 0) {
        let prod = (useful / totalHens) * 100;
        document.getElementById("productivityToday").innerText = prod.toFixed(1);
    } else {
        document.getElementById("productivityToday").innerText = "0.0";
    }

    save();
}

function addOrder() {
    let name = document.getElementById("ordName").value;
    let eggs = +document.getElementById("ordEggs").value;
    let trays = +document.getElementById("ordTrays").value;
    let date = document.getElementById("ordDate").value;
    let note = document.getElementById("ordNote").value;

    if (!name || (!eggs && !trays)) return;

    STATE.orders.push({
        id: Date.now(),
        name,
        eggs,
        trays,
        date,
        note,
        done: false
    });

    save();
    renderOrders();
}

function renderOrders() {
    let active = "";
    let done = "";

    STATE.orders.forEach(o => {
        let row = `
            <tr>
              <td>${o.name}</td>
              <td>${o.eggs}</td>
              <td>${o.trays}</td>
              <td>${o.date}</td>
              <td>${o.note}</td>
              <td>
                <button onclick="toggleOrder(${o.id})">${o.done ? "↩" : "✔"}</button>
              </td>
            </tr>
        `;

        if (!o.done) active += row;
        else done += row;
    });

    document.getElementById("ordersActive").innerHTML = active;
    document.getElementById("ordersDone").innerHTML = done;
}

function toggleOrder(id) {
    let order = STATE.orders.find(o => o.id == id);
    if (!order) return;

    order.done = !order.done;

    save();
    renderOrders();
}

function addIncubation() {
    let name = incBatchName.value;
    let start = incStartDate.value;
    let eggs = +incEggsSet.value;
    let note = incNote.value;

    if (!name || !start || eggs <= 0) return;

    STATE.incubations.push({
        id: Date.now(),
        name,
        start,
        eggs,
        infertile: 0,
        hatched: 0,
        diedInc: 0,
        diedBrood: 0,
        note
    });

    save();
    renderInc();
}

function renderInc() {
    let body = "";
    let filter = document.getElementById("incFilter").value;

    STATE.incubations.forEach(p => {
        body += `
        <tr>
          <td>${p.name}</td>
          <td>${p.start}</td>
          <td>${daysFrom(p.start)}</td>
          <td>${p.eggs}</td>
          <td>${p.infertile}</td>
          <td>${p.hatched}</td>
          <td>${p.diedInc}</td>
          <td>${p.diedBrood}</td>
          <td>${p.eggs - p.infertile - p.diedInc - p.diedBrood}</td>
          <td>—</td>
          <td>${p.note}</td>
          <td><button onclick="deleteInc(${p.id})">✖</button></td>
        </tr>`;
    });

    document.getElementById("incubationBody").innerHTML = body;
}

function daysFrom(d) {
    let start = new Date(d);
    let now = new Date();
    let diff = Math.floor((now - start) / 86400000);
    return diff >= 0 ? diff : 0;
}

function deleteInc(id) {
    STATE.incubations = STATE.incubations.filter(p => p.id !== id);
    save();
    renderInc();
}

window.onload = () => {
    renderOrders();
    renderInc();
    recalcEggsBalance();
    recalcProductivity();
};
