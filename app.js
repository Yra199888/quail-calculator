/* ============================================================
   QUAIL CALCULATOR — PRO MODE (A2 + G2)
   ЄДИНИЙ data.json + offline-черга + autosave + Drive Backup
   ============================================================ */

/* ------------------------------------------------------------
   0. Глобальні змінні
------------------------------------------------------------ */

let DATA = {
    feed: {},
    eggs: {},
    orders: [],
    clients: {},
    finance: {},
    incub: [],
    flock: {},
    logs: [],
    lastSync: null
};

let isOnline = navigator.onLine;
let syncQueue = [];     // офлайн-черга дій
let driveAuthorized = false;
let driveToken = null;

const DATA_FILE = "quail_data.json";


/* ------------------------------------------------------------
   1. Завантаження даних з localStorage
------------------------------------------------------------ */

function loadLocal() {
    try {
        const saved = localStorage.getItem("quail_pro_data");
        if (saved) {
            DATA = JSON.parse(saved);
        }
        console.log("LOCAL LOAD OK");
    } catch (e) {
        console.error("Помилка читання localStorage", e);
    }
}

/* ------------------------------------------------------------
   2. Збереження даних (локально + в офлайн-чергу)
------------------------------------------------------------ */

function saveLocal() {
    try {
        localStorage.setItem("quail_pro_data", JSON.stringify(DATA));
        updateStatus("Збережено локально");
    } catch (e) {
        console.error("Помилка збереження", e);
    }
}

function autosave() {
    saveLocal();
    queueAction({ type: "autosave", time: Date.now(), data: DATA });
}

/* ------------------------------------------------------------
   3. Офлайн-черга синхронізації
------------------------------------------------------------ */

function queueAction(action) {
    syncQueue.push(action);
    localStorage.setItem("quail_sync_queue", JSON.stringify(syncQueue));
}

function loadQueue() {
    try {
        const q = localStorage.getItem("quail_sync_queue");
        syncQueue = q ? JSON.parse(q) : [];
    } catch (e) { syncQueue = []; }
}

async function processQueue() {
    if (!isOnline || !driveAuthorized) return;

    for (let action of syncQueue) {
        await driveBackup(); // зберігаємо все одразу, без дрібних дій
    }

    syncQueue = [];
    localStorage.setItem("quail_sync_queue", "[]");
}


/* ------------------------------------------------------------
   4. Google Drive FULL PRO MODE
------------------------------------------------------------ */

const CLIENT_ID = "764633127034-9t077tdhl7t1bcrsvml5nlil9vitdool.apps.googleusercontent.com";
const API_KEY = "AIzaSyB-_your_key_here"; // Якщо немає – працює без FILE PICKER
const SCOPE = "https://www.googleapis.com/auth/drive.file";

let gisClient = null;

function gapiLoaded() {
    gapi.load("client", initGapiClient);
}

async function initGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    });
    console.log("GAPI ready");
}

function gisLoaded() {
    gisClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (tokenResponse) => {
            driveToken = tokenResponse.access_token;
            driveAuthorized = true;
            updateStatus("Google Drive: увійшли");
        }
    });
}

function loginGoogle() {
    gisClient.requestAccessToken();
}

/* ====== Завантаження файлу з Google Drive ====== */
async function driveRestore() {
    if (!driveAuthorized) return alert("Спочатку увійдіть у Google");

    updateStatus("Відновлення з Drive…");

    const list = await gapi.client.drive.files.list({
        q: `name='${DATA_FILE}'`,
        fields: "files(id,name)"
    });

    if (!list.result.files.length) {
        return alert("Файл не знайдено в Google Drive");
    }

    const fileId = list.result.files[0].id;

    const file = await gapi.client.drive.files.get({
        fileId,
        alt: "media"
    });

    DATA = JSON.parse(file.body);
    saveLocal();
    renderAll();

    updateStatus("Відновлено");
}

/* ====== Резервне копіювання у Google Drive ====== */
async function driveBackup() {
    if (!driveAuthorized) {
        queueAction({ type: "backup" });
        return alert("Немає авторизації Google, дія додана у чергу");
    }

    updateStatus("Створюю резервну копію…");

    const fileContent = JSON.stringify(DATA);
    const blob = new Blob([fileContent], { type: "application/json" });
    const metadata = {
        name: DATA_FILE,
        mimeType: "application/json"
    };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", blob);

    await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
            method: "PATCH",
            headers: new Headers({ "Authorization": "Bearer " + driveToken }),
            body: form
        }
    );

    updateStatus("Резервна копія створена");
}


/* ------------------------------------------------------------
   5. PWA: статус мережі + autosync
------------------------------------------------------------ */

window.addEventListener("online", () => {
    isOnline = true;
    updateStatus("online");
    processQueue();
});

window.addEventListener("offline", () => {
    isOnline = false;
    updateStatus("offline");
});

function updateStatus(text) {
    const el = document.getElementById("statusBar");
    if (el) el.textContent = "Статус: " + text;
}


/* ------------------------------------------------------------
   6. Логіка секцій
   (адаптовано під твої HTML-елементи)
------------------------------------------------------------ */


/* ---------------- FEED ---------------- */
function recalcFeed() {
    autosave();
}

/* ================================
   FEED ENGINE (розрахунки комбікорму)
   ================================ */

const FEED_COMPONENTS = [
    "corn", "wheat", "soy", "sunflower", "barley",
    "fishmeal", "dicalcium", "yeast"
];

function recalcFeed() {
    const batchKg = Number(document.getElementById("feedBatchKg").value);

    if (!DATA.feed.recipe) DATA.feed.recipe = {};
    if (!DATA.feed.stock) DATA.feed.stock = {};
    if (!DATA.feed.need) DATA.feed.need = {};

    // 3.1 (видалено на твоє прохання)

    // -----------------------------
    // 3.2 Добова норма
    // -----------------------------
    const dailyPerHen = Number(feedDailyPerHen.value) / 1000; // г → кг
    const hens = (DATA.flock?.females || 0);
    const dailyNeed = hens * dailyPerHen;

    DATA.feed.dailyNeed = dailyNeed;

    document.getElementById("dailyFeedNeed").textContent = dailyNeed.toFixed(3);
    document.getElementById("dailyFeedCost").textContent =
        (dailyNeed * (DATA.feed.avgPrice || 0)).toFixed(2);

    // -----------------------------
    // 3.3 Запаси компонентів
    // -----------------------------
    let rows = "";

    FEED_COMPONENTS.forEach(c => {
        const have = DATA.feed.stock[c] || 0;
        const need = DATA.feed.need[c] || 0;
        const buy = Math.max(0, need - have);

        rows += `
        <tr>
            <td>${c}</td>
            <td>${have.toFixed(2)}</td>
            <td>${need.toFixed(2)}</td>
            <td>${buy.toFixed(2)}</td>
        </tr>`;
    });

    document.getElementById("stockRows").innerHTML = rows;

    // -----------------------------
    // 3.4 Склад готового комбікорму
    // -----------------------------
    const ready = DATA.feed.ready || 0;
    document.getElementById("feedStockRemain").textContent = ready.toFixed(2);

    const daysLeft = ready / dailyNeed || 0;
    document.getElementById("feedDaysLeft").textContent = Math.floor(daysLeft);

    // -----------------------------
    // 3.5 Мені треба купити
    // -----------------------------
    let buyList = "";
    FEED_COMPONENTS.forEach(c => {
        const need = DATA.feed.need[c] || 0;
        const have = DATA.feed.stock[c] || 0;
        const buy = need - have;

        if (buy > 0.1) {
            buyList += `<li>${c}: <b>${buy.toFixed(2)} кг</b></li>`;
        }
    });

    if (!buyList) buyList = "<li>Все є у достатній кількості ✔</li>";

    document.getElementById("buySummary").innerHTML = buyList;

    autosave();
}

document.getElementById("produceFeedBatch").onclick = () => {
    const batch = Number(feedBatchSize.value);

    DATA.feed.ready = (DATA.feed.ready || 0) + batch;

    // додаємо потребу у компонентах
    FEED_COMPONENTS.forEach(c => {
        const need = DATA.feed.need[c] || 0;
        DATA.feed.need[c] = need + (batch * (DATA.feed.recipe?.[c] || 0));
    });

    recalcFeed();
    autosave();
};

document.getElementById("consumeDailyFeed").onclick = () => {
    const need = DATA.feed.dailyNeed || 0;
    DATA.feed.ready = Math.max(0, (DATA.feed.ready || 0) - need);

    recalcFeed();
    autosave();
};

/* ------------- EGGS --------------- */

function recalcEggsBalance() {
    autosave();
    renderEggs();
}

function recalcProductivity() {
    autosave();
    renderEggs();
}

/* ---------------- ORDERS ---------------- */

function addOrder() {
    const order = {
        id: Date.now(),
        name: ordName.value,
        eggs: Number(ordEggs.value),
        trays: Number(ordTrays.value),
        date: ordDate.value,
        note: ordNote.value,
        done: false
    };

    DATA.orders.push(order);
    autosave();
    renderOrders();
}

function completeOrder(id) {
    const o = DATA.orders.find(o => o.id === id);
    if (o) o.done = true;
    autosave();
    renderOrders();
}

/* ---------------- INCUBATION ---------------- */

document.getElementById("addIncubation").onclick = () => {
    DATA.incub.push({
        id: Date.now(),
        name: incBatchName.value,
        start: incStartDate.value,
        eggs: Number(incEggsSet.value),
        infertile: 0,
        hatched: 0,
        diedInc: 0,
        diedBrooder: 0,
        note: incNote.value
    });

    autosave();
    renderInc();
};

function renderInc() {
    autosave();
}

/* ---------------- FINANCE ---------------- */

function recalcReport() {
    autosave();
}

/* ---------------- FLOCK ---------------- */

function recalcFlock() {
    DATA.flock = {
        males: Number(males.value),
        females: Number(females.value),
        deaths: Number(deaths.value),
        age: Number(avgAge.value)
    };
    autosave();
}


/* ------------------------------------------------------------
   7. Відображення (рендер)
------------------------------------------------------------ */

function renderFeed() {
    recalcFeed();
}
function renderEggs() {}
function renderOrders() {}
function renderClients() {}
function renderFinance() {}
function renderInc() {}
function renderFlock() {}

function renderAll() {
    renderFeed();
    renderEggs();
    renderOrders();
    renderClients();
    renderFinance();
    renderInc();
    renderFlock();
}


/* ------------------------------------------------------------
   8. Ініціалізація
------------------------------------------------------------ */

loadLocal();
loadQueue();
renderAll();

updateStatus(isOnline ? "online" : "offline");

/* Автозбереження кожні 10 секунд */
setInterval(autosave, 10000);

console.log("Quail Calculator PRO MODE app.js loaded");