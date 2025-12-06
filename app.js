// ===============================
//   КАЛЬКУЛЯТОР ПЕРЕПІЛОК — app.js
//   Material 3, Light/Dark Auto
// ===============================
"use strict";

// -------------------------------
//   ДАНІ КОМПОНЕНТІВ КОМБІКОРМУ
// -------------------------------
const feedComponents = [
    { key: "corn",       name: "Кукурудза" },
    { key: "wheat",      name: "Пшениця" },
    { key: "barley",     name: "Ячмінь" },
    { key: "soy",        name: "Соєва макуха" },
    { key: "sunflower",  name: "Соняшникова макуха" },
    { key: "fishmeal",   name: "Рибне борошно" },
    { key: "yeast",      name: "Кормові дріжджі" },
    { key: "tcp",        name: "Трикальційфосфат" },
    { key: "dolfos",     name: "Дольфос D" },
    { key: "salt",       name: "Сіль кухонна" }
];

// Рецепти (базові на 25 кг, далі можна масштабувати)
const recipePresets = {
    starter: {
        corn: 8, wheat: 4, barley: 3, soy: 5,
        sunflower: 2, fishmeal: 1, yeast: 1,
        tcp: 0.5, dolfos: 0.5, salt: 0.1
    },
    grower: {
        corn: 10, wheat: 4, barley: 3, soy: 4,
        sunflower: 1, fishmeal: 0.5, yeast: 0.5,
        tcp: 0.5, dolfos: 0.3, salt: 0.1
    },
    layer: {
        corn: 12, wheat: 5, barley: 4, soy: 5,
        sunflower: 2, fishmeal: 0.5, yeast: 0.5,
        tcp: 1, dolfos: 0.5, salt: 0.2
    }
};

// -------------------------------
//         ХЕЛПЕРИ
// -------------------------------
function getInt(id) {
    const el = document.getElementById(id);
    return el ? (parseInt(el.value) || 0) : 0;
}

function getFloat(id) {
    const el = document.getElementById(id);
    return el ? (parseFloat(el.value) || 0) : 0;
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function loadData(key, fallback = []) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
}

// -------------------------------
//     ГЛОБАЛЬНІ СТАНИ
// -------------------------------
let logData   = loadData("logData", []);
let orders    = loadData("orders", []);
let incData   = loadData("incData", []);

let chartEggs  = null;
let chartIncome = null;

// -------------------------------
//   ГЕНЕРАЦІЯ ТАБЛИЦЬ КОМБІКОРМУ
// -------------------------------
function buildFeedTables() {
    const rows = document.getElementById("feedTableRows");
    const stock = document.getElementById("stockRows");
    rows.innerHTML = "";
    stock.innerHTML = "";

    for (const item of FEED_COMPONENTS) {
        // Рецепт
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.name}</td>
            <td><input type="number" value="${item.percent}" step="1" data-key="${item.key}" class="feed-percent"></td>
            <td><span id="kg_${item.key}">0</span></td>
        `;
        rows.appendChild(tr);

        // Запаси
        const tr2 = document.createElement("tr");
        tr2.innerHTML = `
            <td>${item.name}</td>
            <td><input type="number" id="stock_${item.key}" value="0" step="0.1"></td>
            <td><span id="need_${item.key}">0</span></td>
            <td><span id="buy_${item.key}">0</span></td>
        `;
        stock.appendChild(tr2);
    }

    // Відсотки рецепту — перерахунок при зміні
    for (const inp of document.querySelectorAll(".feed-percent")) {
        inp.addEventListener("input", recalcFeed);
    }
}

// -------------------------------
//     ЗАСТОСУВАННЯ РЕЦЕПТУ
// -------------------------------
function applyRecipePreset(name) {
    const preset = recipePresets[name];
    if (!preset) return;

    const targetKg = getFloat("targetKg") || 25;
    const baseTotal = 25; // базовий рецепт на 25 кг
    const scale = targetKg / baseTotal;

    document.querySelectorAll("#feedRows tr").forEach(row => {
        const key = row.dataset.key;
        const qtySpan = row.querySelector(".feed-qty");
        const baseQty = preset[key] || 0;
        const scaled = baseQty * scale;
        qtySpan.textContent = scaled.toFixed(2);
    });

    recalcFeed();
}

// -------------------------------
//      РОЗРАХУНОК КОМБІКОРМУ
// -------------------------------
function recalcFeed() {
    const batchKg = getFloat("feedBatchKg");
    let dailyPerHen = getFloat("feedDailyPerHen");

    if (dailyPerHen < 1) dailyPerHen = 1;

    // Загальна кількість птиці
    const hens = getInt("hens1") + getInt("hens2");
    set("feedBirdCount", hens);

    const dailyKg = (hens * dailyPerHen) / 1000;
    set("dailyFeedNeed", dailyKg.toFixed(2));

    let totalCost = 0;

    for (const item of FEED_COMPONENTS) {
        const kg = batchKg * (item.percent / 100);
        const stock = getFloat(`stock_${item.key}`);

        set(`kg_${item.key}`, kg.toFixed(2));
        set(`need_${item.key}`, kg.toFixed(2));

        const buy = Math.max(0, kg - stock);
        set(`buy_${item.key}`, buy.toFixed(2));

        totalCost += kg * item.price;
    }

    set("dailyFeedCost", (dailyKg * (totalCost / batchKg)).toFixed(2));

    recalcFeedStockDays();
}

function recalcFeedStockDays() {
    const stock = parseFloat(get("feedReadyStock")) || 0;
    const daily = parseFloat(get("dailyFeedNeed")) || 0;

    set("feedStockRemain", stock.toFixed(2));
    set("feedDaysLeft", daily > 0 ? Math.floor(stock / daily) : 0);
}

// -------------------------------
//     РОЗРАХУНОК ЗАПАСІВ
// -------------------------------
function recalcStockNeed() {
    document.querySelectorAll("#feedRows tr").forEach(row => {
        const key = row.dataset.key;
        const need = parseFloat(row.querySelector(".feed-qty").textContent) || 0;

        const stockRow = document.querySelector(`#stockRows tr[data-key="${key}"]`);
        if (!stockRow) return;

        const have = parseFloat(stockRow.querySelector(".stock-have").value) || 0;
        let buy = need - have;
        if (buy < 0) buy = 0;

        stockRow.querySelector(".stock-need").textContent = need.toFixed(2);
        stockRow.querySelector(".stock-buy").textContent = buy.toFixed(2);
    });
}

// -------------------------------
//        КАЛЬКУЛЯТОР ЯЄЦЬ
// -------------------------------
function recalcEggs() {
    const hens = getInt("hens");
    const rate = getFloat("eggRate");
    const price10 = getFloat("eggPrice10");

    const eggsPerDay = hens * (rate / 100);
    const incomePerDay = (eggsPerDay / 10) * price10;

    const eggsPerDayEl = document.getElementById("eggsPerDay");
    const incomePerDayEl = document.getElementById("incomePerDay");
    const eggsPerMonthEl = document.getElementById("eggsPerMonth");
    const incomePerMonthEl = document.getElementById("incomePerMonth");

    if (eggsPerDayEl) eggsPerDayEl.textContent = eggsPerDay.toFixed(1);
    if (incomePerDayEl) incomePerDayEl.textContent = incomePerDay.toFixed(2);

    const eggsMonth = eggsPerDay * 30;
    const incomeMonth = incomePerDay * 30;

    if (eggsPerMonthEl) eggsPerMonthEl.textContent = eggsMonth.toFixed(0);
    if (incomePerMonthEl) incomePerMonthEl.textContent = incomeMonth.toFixed(2);

    updateCharts();
}

function recalcEggsBalance() {
    const total = getInt("eggsTotal");
    const bad = getInt("eggsBad");
    const own = getInt("eggsOwn");
    const carry = getInt("eggsCarry");
    const trayPrice = getFloat("trayPrice");

    let goodToday = total - bad - own;
    if (goodToday < 0) goodToday = 0;

    const eggsForSale = goodToday;
    const eggsForSaleTotal = eggsForSale + carry;

    const traySize = 20;
    const traysCount = Math.floor(eggsForSaleTotal / traySize);
    const eggsRemainder = eggsForSaleTotal - traysCount * traySize;

    const income = traysCount * trayPrice;

    set("eggsForSale", eggsForSale);
    set("eggsForSaleTotal", eggsForSaleTotal);
    set("traysCount", traysCount);
    set("eggsRemainder", eggsRemainder);
    set("income", income.toFixed(2));

    recalcTraySummary();   // ← ТУТ
}

function recalcProductivity() {
    const hens1 = getInt("hens1");
    const hens2 = getInt("hens2");
    const totalHens = hens1 + hens2;

    set("hensTotal", totalHens);

    const eggsTotal = getInt("eggsTotal");
    const bad = getInt("eggsBad");
    const own = getInt("eggsOwn");

    const goodEggs = eggsTotal - bad - own;

    let prod = 0;
    if (totalHens > 0) prod = (goodEggs / totalHens) * 100;

    set("productivityToday", prod.toFixed(1));
}

function recalcTraySummary() {
    const traysToday = getInt("traysCount");      // лотки із секції 2.1
    const reserved = getInt("reservedTrays");     // з активних замовлень

    const free = Math.max(0, traysToday - reserved);

    set("totalTraysTodayLabel", traysToday);
    set("freeTrays", free);
}

// -------------------------------
//          ЩОДЕННИК (LOG)
// -------------------------------
function addLog() {
    const d = document.getElementById("logDate").value;
    const cat = document.getElementById("logCategory").value.trim();
    const amount = getFloat("logAmount");
    const comment = document.getElementById("logComment").value.trim();

    if (!d || !cat || !amount) return;

    logData.push({ d, cat, amount, comment });
    saveData("logData", logData);
    renderLog();

    document.getElementById("logAmount").value = "";
    document.getElementById("logComment").value = "";
}

function renderLog() {
    const body = document.getElementById("logBody");
    if (!body) return;

    body.innerHTML = "";
    logData.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.d}</td>
            <td>${item.cat}</td>
            <td>${item.amount.toFixed(2)}</td>
            <td>${item.comment}</td>
            <td><button class="m3-btn m3-btn-small" onclick="delLog(${index})">×</button></td>
        `;
        body.appendChild(tr);
    });
}

function delLog(i) {
    logData.splice(i, 1);
    saveData("logData", logData);
    renderLog();
}

// -------------------------------
//           ЗАМОВЛЕННЯ
// -------------------------------
function addOrder() {
    const n = document.getElementById("ordName").value.trim();
    const e = getInt("ordEggs");
    const t = getInt("ordTrays");
    const d = document.getElementById("ordDate").value;
    const note = document.getElementById("ordNote").value.trim();

    if (!n || !e || !d) return;

    orders.push({ n, e, t, d, note, done: false });
    saveData("orders", orders);
    renderOrders();
    recalcTraySummary();

    document.getElementById("ordName").value = "";
    document.getElementById("ordEggs").value = "";
    document.getElementById("ordTrays").value = "";
    document.getElementById("ordNote").value = "";
}

function renderOrders() {
    const activeBody = document.getElementById("ordersActive");
    const doneBody = document.getElementById("ordersDone");
    if (!activeBody || !doneBody) return;

    activeBody.innerHTML = "";
    doneBody.innerHTML = "";

    orders.forEach((o, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${o.n}</td>
            <td>${o.e}</td>
            <td>${o.t}</td>
            <td>${o.d}</td>
            <td>${o.note}</td>
            <td>
                ${o.done
                    ? `<button class="m3-btn m3-btn-small" onclick="delOrder(${i})">×</button>`
                    : `
                        <button class="m3-btn m3-btn-small" onclick="finishOrder(${i})">✓</button>
                        <button class="m3-btn m3-btn-small" onclick="delOrder(${i})">×</button>
                      `
                }
            </td>
        `;
        if (o.done) doneBody.appendChild(tr);
        else activeBody.appendChild(tr);
    });
}

function finishOrder(i) {
    orders[i].done = true;
    saveData("orders", orders);
    renderOrders();
}

function delOrder(i) {
    orders.splice(i, 1);
    saveData("orders", orders);
    renderOrders();
}

//---------------------------------------------------
//  ІНКУБАЦІЯ — ЗБЕРІГАННЯ / ЗАВАНТАЖЕННЯ ДАНИХ
//---------------------------------------------------

let INC = JSON.parse(localStorage.getItem("INCUBATION") || "[]");

function saveInc() {
    localStorage.setItem("INCUBATION", JSON.stringify(INC));
}

function loadInc() {
    INC = JSON.parse(localStorage.getItem("INCUBATION") || "[]");
}


//---------------------------------------------------
//  РОЗРАХУНОК ДНІВ В ІНКУБАЦІЇ
//---------------------------------------------------
function daysSince(dateStr) {
    if (!dateStr) return 0;
    const d1 = new Date(dateStr);
    const d2 = new Date();
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}


//---------------------------------------------------
//  ДОДАТИ НОВУ ПАРТІЮ
//---------------------------------------------------
function addIncubation() {
    const batchName = document.getElementById("incBatchName").value.trim();
    const startDate = document.getElementById("incStartDate").value;
    const eggsSet = getInt("incEggsSet");
    const note = document.getElementById("incNote").value.trim();

    if (!batchName || !startDate || eggsSet <= 0) {
        alert("Заповніть всі обов’язкові поля!");
        return;
    }

    const obj = {
        batchName,
        startDate,
        eggsSet,
        eggsInfertile: 0,
        eggsHatched: 0,
        deadIncubator: 0,
        deadBrooder: 0,
        aliveNow: eggsSet, 
        humidityStart: "",
        humidityFinish: "",
        tempStart: "",
        tempFinish: "",
        note
    };

    INC.push(obj);
    saveInc();
    renderInc();

    // Очистити форму
    document.getElementById("incBatchName").value = "";
    document.getElementById("incStartDate").value = "";
    document.getElementById("incEggsSet").value = 0;
    document.getElementById("incNote").value = "";
}


//---------------------------------------------------
//  ОНОВИТИ ОКРЕМЕ ПОЛЕ ПАРТІЇ (редагування прямо в таблиці)
//---------------------------------------------------
function updateIncField(i, field, value) {
    const num = parseInt(value) || 0;

    INC[i][field] = num;

    // авто-рахунок живих
    INC[i].aliveNow =
        INC[i].eggsSet -
        INC[i].eggsInfertile -
        INC[i].deadIncubator -
        INC[i].deadBrooder;

    if (INC[i].aliveNow < 0) INC[i].aliveNow = 0;

    saveInc();
    renderInc();
}


//---------------------------------------------------
//  ВИДАЛИТИ ПАРТІЮ
//---------------------------------------------------
function deleteInc(i) {
    if (!confirm("Видалити цю інкубаційну партію?")) return;
    INC.splice(i, 1);
    saveInc();
    renderInc();
}


//---------------------------------------------------
//  РЕНДЕР СПИСКУ ПАРТІЙ (повна таблиця)
//---------------------------------------------------
function renderInc() {
    loadInc();
    const body = document.getElementById("incubationBody");
    body.innerHTML = "";

    INC.forEach((item, i) => {
        const days = daysSince(item.startDate);

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.batchName}</td>
            <td>${item.startDate}</td>
            <td>${days}</td>
            <td>${item.eggsSet}</td>

            <td><input type="number" value="${item.eggsInfertile}" onchange="updateIncField(${i}, 'eggsInfertile', this.value)" class="m3-input" style="width:70px;"></td>

            <td><input type="number" value="${item.eggsHatched}" onchange="updateIncField(${i}, 'eggsHatched', this.value)" class="m3-input" style="width:70px;"></td>

            <td><input type="number" value="${item.deadIncubator}" onchange="updateIncField(${i}, 'deadIncubator', this.value)" class="m3-input" style="width:70px;"></td>

            <td><input type="number" value="${item.deadBrooder}" onchange="updateIncField(${i}, 'deadBrooder', this.value)" class="m3-input" style="width:70px;"></td>

            <td>${item.aliveNow}</td>

            <td>${item.note || ""}</td>

            <td>
                <button class="btn small-btn" onclick="deleteInc(${i})">🗑</button>
            </td>
        `;

        body.appendChild(tr);
    });
}

// -------------------------------
//      ПОГОЛІВ’Я (ПТАШНИК)
// -------------------------------
function recalcFlock() {
    const males = getInt("males");
    const females = getInt("females");
    const deaths = getInt("deaths");

    const total = males + females - deaths;
    const el = document.getElementById("flockTotal");
    if (el) el.textContent = total >= 0 ? total : 0;
}

// -------------------------------
//       ФІНАНСОВИЙ ЗВІТ
// -------------------------------
function recalcReport() {
    const fromStr = document.getElementById("repFrom").value;
    const toStr = document.getElementById("repTo").value;
    if (!fromStr || !toStr) return;

    const from = new Date(fromStr);
    const to = new Date(toStr);
    to.setHours(23, 59, 59, 999);

    let costs = 0;

    logData.forEach(item => {
        const d = new Date(item.d);
        if (d >= from && d <= to) {
            costs += item.amount;
        }
    });

    const hens = getInt("hens");
    const rate = getFloat("eggRate");
    const price10 = getFloat("eggPrice10");

    const eggsPerDay = hens * (rate / 100);
    const eggsTotal = eggsPerDay * 30;
    const income = (eggsPerDay / 10) * price10 * 30;

    const profit = income - costs;

    const repCostsEl = document.getElementById("repCosts");
    const repIncomeEl = document.getElementById("repIncome");
    const repProfitEl = document.getElementById("repProfit");

    if (repCostsEl) repCostsEl.textContent = costs.toFixed(2);
    if (repIncomeEl) repIncomeEl.textContent = income.toFixed(2);
    if (repProfitEl) repProfitEl.textContent = profit.toFixed(2);

    const costPerEggEl = document.getElementById("repCostPerEgg");
    const profitPerEggEl = document.getElementById("repProfitPerEgg");

    if (eggsTotal > 0) {
        const costPerEgg = costs / eggsTotal;
        const profitPerEgg = profit / eggsTotal;
        if (costPerEggEl) costPerEggEl.textContent = costPerEgg.toFixed(3);
        if (profitPerEggEl) profitPerEggEl.textContent = profitPerEgg.toFixed(3);
    } else {
        if (costPerEggEl) costPerEggEl.textContent = "0.000";
        if (profitPerEggEl) profitPerEggEl.textContent = "0.000";
    }
}

// -------------------------------
//          ГРАФІКИ (Chart.js)
// -------------------------------
function buildCharts() {
    const ctxEggs = document.getElementById("chartEggs");
    const ctxIncome = document.getElementById("chartIncome");
    if (!ctxEggs || !ctxIncome || typeof Chart === "undefined") return;

    const labels = Array.from({ length: 30 }, (_, i) => i + 1);

    const hens = getInt("hens");
    const rate = getFloat("eggRate");
    const price10 = getFloat("eggPrice10");
    const eggsPerDay = hens * (rate / 100);
    const incomePerDay = (eggsPerDay / 10) * price10;

    chartEggs = new Chart(ctxEggs, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Яєць/день",
                data: labels.map(() => eggsPerDay),
                tension: 0.3
            }]
        }
    });

    chartIncome = new Chart(ctxIncome, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Дохід/день (грн)",
                data: labels.map(() => incomePerDay),
                tension: 0.3
            }]
        }
    });
}

function updateCharts() {
    if (!chartEggs || !chartIncome) return;

    const hens = getInt("hens");
    const rate = getFloat("eggRate");
    const price10 = getFloat("eggPrice10");
    const eggsPerDay = hens * (rate / 100);
    const incomePerDay = (eggsPerDay / 10) * price10;

    chartEggs.data.datasets[0].data = chartEggs.data.labels.map(() => eggsPerDay);
    chartIncome.data.datasets[0].data = chartIncome.data.labels.map(() => incomePerDay);

    chartEggs.update();
    chartIncome.update();
}

// -------------------------------
//        GOOGLE DRIVE BACKUP
// -------------------------------
let tokenClient = null;
let gapiInited = false;
let gisInited = false;

function updateDriveUI() {
    const btnLogin = document.getElementById("btnDriveLogin");
    const btnBackup = document.getElementById("btnBackup");
    const btnRestore = document.getElementById("btnRestore");
    const status = document.getElementById("driveStatus");

    if (!btnLogin || !btnBackup || !btnRestore || !status) return;

    if (gapiInited && gisInited) {
        status.textContent = "Статус: сервіс готовий, увійдіть у Google";
        btnLogin.disabled = false;
    } else {
        status.textContent = "Статус: ініціалізація...";
        btnLogin.disabled = true;
        btnBackup.disabled = true;
        btnRestore.disabled = true;
    }

    const token = gapi.client && gapi.client.getToken ? gapi.client.getToken() : null;
    if (token && token.access_token) {
        status.textContent = "Статус: авторизовано";
        btnBackup.disabled = false;
        // Відновлення можна реалізувати пізніше
    }
}

// Викликається по onload у script api.js
function gapiLoaded() {
    if (!window.gapi) return;
    gapi.load("client", async () => {
        try {
            await gapi.client.init({
                apiKey: "YOUR_API_KEY_HERE", // заміни на свій API KEY
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
            });
            gapiInited = true;
            updateDriveUI();
        } catch (e) {
            console.error("Помилка ініціалізації GAPI:", e);
        }
    });
}

// Викликається по onload у script gsi/client
function gisLoaded() {
    if (!window.google || !google.accounts || !google.accounts.oauth2) return;

    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: "YOUR_CLIENT_ID_HERE", // заміни на свій Client ID
        scope: "https://www.googleapis.com/auth/drive.file",
        callback: ""
    });
    gisInited = true;
    updateDriveUI();
}

async function requestDriveToken() {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            return reject("Token client not initialized");
        }
        tokenClient.callback = resp => {
            if (resp.error) {
                reject(resp);
            } else {
                updateDriveUI();
                resolve(resp);
            }
        };
        tokenClient.requestAccessToken({ prompt: "" });
    });
}

async function backupToDrive() {
    try {
        await requestDriveToken();
        const token = gapi.client.getToken();
        if (!token || !token.access_token) {
            alert("Не вдалося отримати токен доступу.");
            return;
        }

        const backupData = {
            logData,
            orders,
            incData
        };

        const metadata = {
            name: "quail-calculator-backup.json",
            mimeType: "application/json"
        };

        const fileContent = JSON.stringify(backupData);
        const boundary = "-------314159265358979323846";
        const delimiter = "\r\n--" + boundary + "\r\n";
        const closeDelim = "\r\n--" + boundary + "--";

        const multipartRequestBody =
            delimiter +
            "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
            JSON.stringify(metadata) +
            delimiter +
            "Content-Type: application/json\r\n\r\n" +
            fileContent +
            closeDelim;

        const response = await fetch(
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
            {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token.access_token,
                    "Content-Type": "multipart/related; boundary=" + boundary
                },
                body: multipartRequestBody
            }
        );

        if (!response.ok) {
            console.error("Drive upload error:", await response.text());
            alert("Помилка при створенні резервної копії (див. консоль).");
            return;
        }

        alert("Резервна копія створена на Google Drive!");
    } catch (e) {
        console.error(e);
        alert("Помилка при авторизації або створенні копії.");
    }
}

document.addEventListener("click", (e) => {
    if (e.target.id === "produceFeedBatch") {
        const size = getFloat("feedBatchSize");
        let stock = parseFloat(get("feedReadyStock")) || 0;

        stock += size;

        set("feedReadyStock", stock.toFixed(2));
        recalcFeedStockDays();
    }
});

document.addEventListener("click", (e) => {
    if (e.target.id === "consumeDailyFeed") {
        const daily = parseFloat(get("dailyFeedNeed")) || 0;
        let stock = parseFloat(get("feedReadyStock")) || 0;

        stock = Math.max(0, stock - daily);

        set("feedReadyStock", stock.toFixed(2));
        recalcFeedStockDays();
    }
});


// -------------------------------
//            INIT
// -------------------------------
function init() {
    // Корм
    buildFeedTables();
    recalcFeed();

    // Яйця (нові функції)
    recalcEggs();            // старий теоретичний розрахунок, якщо потрібен
    recalcEggsBalance();     // новий облік яєць
    recalcProductivity();    // нова продуктивність
    recalcTraySummary();

    // Поголів'я
    recalcFlock();

    // Логи / замовлення / інкубація
    renderLog();
    renderOrders();
    renderInc();

    document.getElementById("addIncubation").addEventListener("click", addIncubation);

    // Встановлення дат
    const today = new Date();
    const prior = new Date();
    prior.setDate(today.getDate() - 30);

    if (document.getElementById("repFrom")) document.getElementById("repFrom").value = toIso(prior);
    if (document.getElementById("repTo"))   document.getElementById("repTo").value   = toIso(today);

    if (document.getElementById("logDate")) document.getElementById("logDate").value = toIso(today);
    if (document.getElementById("ordDate")) document.getElementById("ordDate").value = toIso(today);
    if (document.getElementById("incDate")) document.getElementById("incDate").value = toIso(today);

    // Фінансова аналітика
    recalcSummary();
    recalcReport();
    recalcForecast30();

    // Графіки
    buildCharts();

    // Google Drive
    updateDriveUI();
}

window.addEventListener("load", init);