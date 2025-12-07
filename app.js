/* ============================================================
   0. ІНІЦІАЛІЗАЦІЯ
============================================================ */

let feedRecipe = {
    corn: 40,
    wheat: 20,
    soy: 20,
    fish: 10,
    calcium: 5,
    premix: 5
};

let feedStock = {
    corn: 0,
    wheat: 0,
    soy: 0,
    fish: 0,
    calcium: 0,
    premix: 0
};

let readyFeedKg = 0;

let orders = [];
let incubation = [];

/* ============================================================
   1. Вкладки
============================================================ */
function showPage(id) {
    document.querySelectorAll(".m3-card, .section-page").forEach(sec => {
        sec.style.display = "none";
    });

    document.querySelectorAll(".m3-tab").forEach(tab => tab.classList.remove("active"));

    document.getElementById(id).style.display = "block";
    document.querySelector(`.m3-tab[onclick="showPage('${id}')"]`).classList.add("active");
}

/* ============================================================
   2. Розрахунок корму
============================================================ */
function recalcFeed() {
    const batchKg = Number(document.getElementById("feedBatchKg")?.value || 25);
    const perHen = Number(document.getElementById("feedDailyPerHen")?.value || 30);

    const hens1 = Number(document.getElementById("hens1")?.value || 0);
    const hens2 = Number(document.getElementById("hens2")?.value || 0);
    const totalBirds = hens1 + hens2;

    if (document.getElementById("feedBirdCount"))
        document.getElementById("feedBirdCount").textContent = totalBirds;

    let tbody = document.getElementById("feedTableRows");
    if (!tbody) return;

    tbody.innerHTML = "";
    let totalKg = 0;

    for (let comp in feedRecipe) {
        let percent = feedRecipe[comp];
        let kg = batchKg * percent / 100;
        totalKg += kg;

        let row = `
        <tr>
            <td>${comp}</td>
            <td>${percent}%</td>
            <td>${kg.toFixed(2)}</td>
        </tr>`;
        tbody.insertAdjacentHTML("beforeend", row);
    }

    // добова потреба
    let dailyKg = totalBirds * perHen / 1000;
    if (document.getElementById("dailyFeedNeed"))
        document.getElementById("dailyFeedNeed").textContent = dailyKg.toFixed(2);

    // добова вартість — поки 0
    if (document.getElementById("dailyFeedCost"))
        document.getElementById("dailyFeedCost").textContent = (0).toFixed(2);

    updateFeedStock();
}

/* ============================================================
   3. Склад готового комбікорму
============================================================ */

document.addEventListener("click", evt => {
    if (evt.target.id === "produceFeedBatch") {
        let size = Number(document.getElementById("feedBatchSize").value);
        readyFeedKg += size;
        updateFeedStock();
    }

    if (evt.target.id === "consumeDailyFeed") {
        const hens1 = Number(document.getElementById("hens1")?.value || 0);
        const hens2 = Number(document.getElementById("hens2")?.value || 0);
        const perHen = Number(document.getElementById("feedDailyPerHen")?.value || 30);

        let dailyKg = (hens1 + hens2) * perHen / 1000;
        readyFeedKg = Math.max(0, readyFeedKg - dailyKg);

        updateFeedStock();
    }
});

function updateFeedStock() {
    let hens1 = Number(document.getElementById("hens1")?.value || 0);
    let hens2 = Number(document.getElementById("hens2")?.value || 0);
    let perHen = Number(document.getElementById("feedDailyPerHen")?.value || 30);

    let dailyKg = (hens1 + hens2) * perHen / 1000;
    let daysLeft = dailyKg > 0 ? Math.floor(readyFeedKg / dailyKg) : 0;

    if (document.getElementById("feedStockRemain"))
        document.getElementById("feedStockRemain").textContent = readyFeedKg.toFixed(2);

    if (document.getElementById("feedDaysLeft"))
        document.getElementById("feedDaysLeft").textContent = daysLeft;
}

/* ============================================================
   4. Облік яєць
============================================================ */
function recalcEggsBalance() {
    let total = Number(eggsTotal.value);
    let bad = Number(eggsBad.value);
    let own = Number(eggsOwn.value);
    let carry = Number(eggsCarry.value);
    let price = Number(trayPrice.value);

    let good = total - bad - own;
    if (good < 0) good = 0;

    let todaySale = good;
    let totalForSale = todaySale + carry;

    eggsForSale.textContent = todaySale;
    eggsForSaleTotal.textContent = totalForSale;

    let trays = Math.floor(totalForSale / 20);
    let rem = totalForSale % 20;

    traysCount.textContent = trays;
    eggsRemainder.textContent = rem;

    income.textContent = (trays * price).toFixed(2);

    // Підсумок лотків
    totalTraysTodayLabel.textContent = trays;

    recalcFreeTrays();
}

/* ============================================================
   5. Продуктивність
============================================================ */
function recalcProductivity() {
    let hens1 = Number(hens1?.value || 0);
    let hens2 = Number(hens2?.value || 0);
    let total = hens1 + hens2;

    hensTotal.textContent = total;

    let eggs = Number(eggsTotal.value) - Number(eggsBad.value);
    let prod = total > 0 ? (eggs / total * 100) : 0;

    productivityToday.textContent = prod.toFixed(1);

    recalcFeed();
}

/* ============================================================
   6. Замовлення
============================================================ */
function addOrder() {
    let name = ordName.value.trim();
    let eggs = Number(ordEggs.value);
    let trays = Number(ordTrays.value);
    let date = ordDate.value;
    let note = ordNote.value;

    if (!name || (!eggs && !trays)) return;

    let obj = {
        id: Date.now(),
        name,
        eggs,
        trays,
        date,
        note,
        done: false
    };

    orders.push(obj);
    renderOrders();
    recalcFreeTrays();
}

function toggleOrder(id) {
    let o = orders.find(x => x.id === id);
    if (!o) return;
    o.done = !o.done;
    renderOrders();
    buildClients();
    recalcFreeTrays();
}

function renderOrders() {
    let active = "";
    let completed = "";

    orders.forEach(o => {
        let row = `
        <tr>
            <td>${o.name}</td>
            <td>${o.eggs}</td>
            <td>${o.trays}</td>
            <td>${o.date}</td>
            <td>${o.note}</td>
            <td><button onclick="toggleOrder(${o.id})">${o.done ? "❌" : "✔"}</button></td>
        </tr>`;

        if (o.done) completed += row;
        else active += row;
    });

    ordersActive.innerHTML = active;
    ordersDone.innerHTML = completed;
}

function recalcFreeTrays() {
    let reserved = orders.filter(o => !o.done).reduce((s, x) => s + x.trays, 0);

    reservedTrays.textContent = reserved;

    freeTrays.textContent = Math.max(0, Number(totalTraysTodayLabel.textContent) - reserved);
}

/* ============================================================
   7. Клієнти
============================================================ */
function buildClients() {
    let map = {};

    orders.filter(o => o.done).forEach(o => {
        if (!map[o.name]) {
            map[o.name] = {count: 0, trays: 0, eggs: 0, sum: 0, last: ""};
        }
        map[o.name].count++;
        map[o.name].trays += o.trays;
        map[o.name].eggs += o.eggs;
        map[o.name].sum += o.trays * Number(trayPrice.value);
        map[o.name].last = o.date;
    });

    clientsBody.innerHTML = "";

    for (let n in map) {
        let c = map[n];
        clientsBody.insertAdjacentHTML("beforeend", `
        <tr>
            <td>${n}</td>
            <td>${c.count}</td>
            <td>${c.trays}</td>
            <td>${c.eggs}</td>
            <td>${c.sum.toFixed(2)}</td>
            <td>${c.last}</td>
        </tr>
        `);
    }
}

/* ============================================================
   8. Інкубація
============================================================ */
document.addEventListener("click", evt => {
    if (evt.target.id === "addIncubation") {
        let obj = {
            id: Date.now(),
            name: incBatchName.value,
            start: incStartDate.value,
            set: Number(incEggsSet.value),
            clear: 0,
            hatch: 0,
            diedInc: 0,
            diedBrood: 0,
            note: incNote.value,
            reminder: "",
            done: false
        };

        incubation.push(obj);
        renderInc();
    }
});

function renderInc() {
    let filter = incFilter.value;
    incubationBody.innerHTML = "";

    incubation.forEach(p => {
        let days = Math.floor((Date.now() - new Date(p.start)) / 86400000);

        if (filter === "active" && p.done) return;
        if (filter === "done" && !p.done) return;

        let row = `
        <tr>
            <td>${p.name}</td>
            <td>${p.start}</td>
            <td>${days}</td>
            <td>${p.set}</td>
            <td>${p.clear}</td>
            <td>${p.hatch}</td>
            <td>${p.diedInc}</td>
            <td>${p.diedBrood}</td>
            <td>${p.set - p.clear - p.hatch - p.diedInc - p.diedBrood}</td>
            <td>${p.reminder}</td>
            <td>${p.note}</td>
            <td><button onclick="toggleInc(${p.id})">✔/❌</button></td>
        </tr>`;
        incubationBody.insertAdjacentHTML("beforeend", row);
    });
}

function toggleInc(id) {
    let p = incubation.find(x => x.id === id);
    if (!p) return;
    p.done = !p.done;
    renderInc();
}

/* ============================================================
   9. ПІДСУМКИ, ЗВІТ, ПРОГНОЗ
============================================================ */
function recalcSummary() {
    summaryFeedCost.textContent = dailyFeedCost.textContent;
    summaryEggIncome.textContent = income.textContent;

    summaryProfit.textContent =
        (Number(income.textContent) - Number(dailyFeedCost.textContent)).toFixed(2);
}

function recalcReport() {
    repDays.textContent = reportPeriod.value;
    repEggs.textContent = eggsTotal.value;
    repTrays.textContent = traysCount.textContent;
    repIncome.textContent = income.textContent;
    repFeedCost.textContent = dailyFeedCost.textContent;

    let profit = Number(income.textContent) - Number(dailyFeedCost.textContent);
    repProfit.textContent = profit.toFixed(2);

    repProdAvg.textContent = productivityToday.textContent;

    repCostPerEgg.textContent = (Number(dailyFeedCost.textContent) / Number(eggsTotal.value || 1)).toFixed(3);

    repProfitPerEgg.textContent =
        (Number(income.textContent) / Number(eggsTotal.value || 1)).toFixed(3);

    repProfitPerHen.textContent =
        (profit / Number(hensTotal.textContent || 1)).toFixed(2);
}

function recalcForecast() {
    let trays = Number(traysCount.textContent);
    let price = Number(trayPrice.value);
    let feed = Number(dailyFeedCost.textContent);

    fcastTrays.textContent = trays * 30;
    fcastEggs.textContent = Number(eggsForSale.textContent) * 30;

    fcastIncome.textContent = (trays * 30 * price).toFixed(2);
    fcastFeedCost.textContent = (feed * 30).toFixed(2);

    fcastProfit.textContent =
        ((trays * 30 * price) - (feed * 30)).toFixed(2);
}

/* ============================================================
   10. INIT
============================================================ */
window.onload = () => {
    showPage("feed");
    recalcFeed();
    recalcEggsBalance();
    recalcProductivity();
};
