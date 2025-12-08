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

document.getElementById("produceFeedBatch").onclick = () => {
    DATA.feed.ready = (DATA.feed.ready || 0) + Number(document.getElementById("feedBatchSize").value);
    autosave();
    renderFeed();
};

document.getElementById("consumeDailyFeed").onclick = () => {
    DATA.feed.ready = (DATA.feed.ready || 0) - (DATA.feed.dailyNeed || 0);
    if (DATA.feed.ready < 0) DATA.feed.ready = 0;
    autosave();
    renderFeed();
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

function renderFeed() {}
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