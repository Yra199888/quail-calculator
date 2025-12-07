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
    document.querySelectorAll(".section-page").forEach(sec => {
        sec.style.display = "none";
    });

    document.getElementById(id).style.display = "block";

    document.querySelectorAll(".m3-tab").forEach(t => t.classList.remove("active"));
    document.querySelector(`.m3-tab[onclick="showPage('${id}')"]`).classList.add("active");
}


/* ============================================================
   2. Розрахунок корму
============================================================ */

/**
 * Пресети рецепту комбікорму.
 * Викликається з кнопок "Стартер / Гровер / Несучки".
 */
function applyRecipePreset(type) {
    if (type === "starter") {
        // приклад: стартер
        feedRecipe = {
            corn: 45,
            wheat: 15,
            soy: 20,
            fish: 10,
            calcium: 5,
            premix: 5
        };
    } else if (type === "grower") {
        // приклад: гровер
        feedRecipe = {
            corn: 40,
            wheat: 25,
            soy: 18,
            fish: 7,
            calcium: 5,
            premix: 5
        };
    } else if (type === "layer") {
        // приклад: несучки
        feedRecipe = {
            corn: 50,
            wheat: 20,
            soy: 15,
            fish: 5,
            calcium: 5,
            premix: 5
        };
    }
    recalcFeed();
}

/**
 * Основний перерахунок корму.
 * Працює ОДРАЗУ для двох секцій:
 * 1) твоя секція "1. Комбікорм" (targetKg, feedRows, feedTotalKg...)
 * 2) секція 3.* (feedBatchKg, feedTableRows, dailyFeedNeed...)
 */
function recalcFeed() {
    // вага партії: або з feedBatchKg, або з targetKg (секція 1)
    const batchInput =
        document.getElementById("feedBatchKg") ||
        document.getElementById("targetKg");
    const batchKg = batchInput ? Number(batchInput.value || 0) : 25;

    // добова норма на 1 самку (секція 3.2)
    const perHen = Number(
        document.getElementById("feedDailyPerHen")?.value || 30
    );

    // загальна кількість птахів з hens1 + hens2
    const hens1El = document.getElementById("hens1");
    const hens2El = document.getElementById("hens2");
    const hens1Val = hens1El ? Number(hens1El.value || 0) : 0;
    const hens2Val = hens2El ? Number(hens2El.value || 0) : 0;
    const totalBirds = hens1Val + hens2Val;

    const birdCountEl = document.getElementById("feedBirdCount");
    if (birdCountEl) birdCountEl.textContent = totalBirds;

    // тіла таблиць для двох секцій
    const tbody3 = document.getElementById("feedTableRows"); // секція 3.1
    const tbody1 = document.getElementById("feedRows");      // секція 1

    if (tbody3) tbody3.innerHTML = "";
    if (tbody1) tbody1.innerHTML = "";

    let totalKg = 0;

    // проходимось по рецепту
    for (const comp in feedRecipe) {
        const percent = feedRecipe[comp];
        const kg = (batchKg * percent) / 100;
        totalKg += kg;

        // заповнюємо таблицю 3.1 (Компонент / % / кг)
        if (tbody3) {
            tbody3.insertAdjacentHTML(
                "beforeend",
                `<tr>
                    <td>${comp}</td>
                    <td>${percent}%</td>
                    <td>${kg.toFixed(2)}</td>
                </tr>`
            );
        }

        // заповнюємо таблицю 1. Комбікорм (Компонент / кг / Ціна / Сума)
        if (tbody1) {
            tbody1.insertAdjacentHTML(
                "beforeend",
                `<tr>
                    <td>${comp}</td>
                    <td>${kg.toFixed(2)}</td>
                    <td>-</td>
                    <td>-</td>
                </tr>`
            );
        }
    }

    // підсумки для секції 1 (якщо є)
    const totalKgEl = document.getElementById("feedTotalKg");
    if (totalKgEl) totalKgEl.textContent = totalKg.toFixed(2);

    const totalCostEl = document.getElementById("feedTotalCost");
    if (totalCostEl) totalCostEl.textContent = "0";

    // добова потреба комбікорму (секція 3.2)
    const dailyKg = (totalBirds * perHen) / 1000;
    const needEl = document.getElementById("dailyFeedNeed");
    if (needEl) needEl.textContent = dailyKg.toFixed(2);

    // поки що вартість доби = 0 (можеш доробити потім)
    const costEl = document.getElementById("dailyFeedCost");
    if (costEl) costEl.textContent = (0).toFixed(2);

    // оновити інформацію по готовому корму
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
    const hens1Input = document.getElementById("hens1");
    const hens2Input = document.getElementById("hens2");

    const hens1Val = hens1Input ? Number(hens1Input.value || 0) : 0;
    const hens2Val = hens2Input ? Number(hens2Input.value || 0) : 0;

    const total = hens1Val + hens2Val;

    const hensTotalEl = document.getElementById("hensTotal");
    if (hensTotalEl) hensTotalEl.textContent = total;

    const eggsTotalVal = Number(document.getElementById("eggsTotal")?.value || 0);
    const eggsBadVal   = Number(document.getElementById("eggsBad")?.value   || 0);
    const eggsGood = Math.max(0, eggsTotalVal - eggsBadVal);

    const prod = total > 0 ? (eggsGood / total * 100) : 0;

    const prodEl = document.getElementById("productivityToday");
    if (prodEl) prodEl.textContent = prod.toFixed(1);

    // перерахувати корм з урахуванням нової кількості самок
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
   10. БАЗОВІ РЕЦЕПТИ
============================================================ */
const recipes = {
    starter: {
        "Кукурудза": 40,
        "Пшениця": 20,
        "Соєвий шрот": 25,
        "Соняшниковий шрот": 10,
        "Рибне борошно": 5
    },
    grower: {
        "Кукурудза": 45,
        "Пшениця": 25,
        "Соєвий шрот": 20,
        "Соняшниковий шрот": 8,
        "Рибне борошно": 2
    },
    layer: {
        "Кукурудза": 50,
        "Пшениця": 20,
        "Соєвий шрот": 15,
        "Соняшниковий шрот": 10,
        "Крейда": 5
    }
};


// ==== ПІДСТАВИТИ РЕЦЕПТ ПРИ НАТИСКАННІ КНОПКИ ====
function applyRecipePreset(type) {
    const recipe = recipes[type];
    if (!recipe) return;

    const tbody = document.getElementById("feedRows");
    tbody.innerHTML = "";

    for (const comp in recipe) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${comp}</td>
            <td><input type="number" class="feed-kg" value="${recipe[comp]}" onchange="recalcFeed()"></td>
            <td><input type="number" class="feed-price" value="0" onchange="recalcFeed()"></td>
            <td class="feed-sum">0</td>
        `;
        tbody.appendChild(tr);
    }

    recalcFeed();
}


// ==== ПЕРЕРАХУНОК ВАГИ ТА ЦІНИ ====
function recalcFeed() {
    let totalKg = 0;
    let totalCost = 0;

    const kgInputs = document.querySelectorAll(".feed-kg");
    const priceInputs = document.querySelectorAll(".feed-price");
    const sumCells = document.querySelectorAll(".feed-sum");

    kgInputs.forEach((kg, i) => {
        const kgVal = parseFloat(kg.value) || 0;
        const priceVal = parseFloat(priceInputs[i].value) || 0;
        const sum = kgVal * priceVal;

        sumCells[i].textContent = sum.toFixed(2);

        totalKg += kgVal;
        totalCost += sum;
    });

    document.getElementById("feedTotalKg").textContent = totalKg.toFixed(1);
    document.getElementById("feedTotalCost").textContent = totalCost.toFixed(2);
}


/* ============================================================
   GOOGLE DRIVE — FULL PRO BACKUP MODE
============================================================ */

const CLIENT_ID = "764633127034-9t077tdhl7t1bcrsvml5nlil9vitdool.apps.googleusercontent.com";
const API_KEY = "AIzaSyD0t-REPLACE-YOURS";  // якщо немає — залиш пустим
const SCOPES = "https://www.googleapis.com/auth/drive.file";

let tokenClient;
let gapiInited = false;
let gisInited = false;

function gapiLoaded() {
    gapi.load("client", initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    });
    gapiInited = true;
    updateDriveUI();
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: "",
    });
    gisInited = true;
    updateDriveUI();
}

function updateDriveUI() {
    if (gapiInited && gisInited) {
        document.getElementById("btnDriveLogin").disabled = false;
    }
}

document.getElementById("btnDriveLogin").onclick = () => {
    tokenClient.callback = async (resp) => {
        if (resp.error) throw resp;

        document.getElementById("driveStatus").textContent = "Авторизовано ✔";
        document.getElementById("btnBackup").disabled = false;
        document.getElementById("btnRestore").disabled = false;
    };

    tokenClient.requestAccessToken();
};

document.getElementById("btnBackup").onclick = async () => {
    const content = JSON.stringify({ 
        orders, 
        incubation, 
        readyFeedKg,
    });

    const file = new Blob([content], { type: "application/json" });
    const metadata = {
        name: "quail-backup.json",
        mimeType: "application/json"
    };

    const accessToken = gapi.client.getToken().access_token;

    let form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", file);

    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: new Headers({ "Authorization": "Bearer " + accessToken }),
        body: form
    });

    if (res.ok) {
        document.getElementById("driveStatus").textContent = "Резервна копія створена ✔";
    } else {
        alert("Помилка завантаження!");
    }
};

document.getElementById("btnRestore").onclick = async () => {
    alert("PRO Restore потребує вибору файлу — доробимо після тесту Backup.");
};


/* ============================================================
   11. INIT
============================================================ */
window.onload = () => {
    showPage("feed");
    recalcFeed();
    recalcEggsBalance();
    recalcProductivity();
};
