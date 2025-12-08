/* ======================================================
     QUAIL CALCULATOR — PRO MODE
     ЄДИНИЙ data.json + Offline + Autosave + Drive Sync
   ====================================================== */

/*
 Структура основної бази даних
 everything inside ONE object → data.json
*/
let DB = {
    feed: {
        components: {},
        readyStock: 0,
        history: []
    },
    eggs: {
        days: [],
        today: {},
        totalTrays: 0
    },
    orders: {
        active: [],
        done: []
    },
    clients: {},
    finance: {
        logs: [],
        summary: {}
    },
    incub: {
        batches: []
    },
    flock: {
        males: 0,
        females: 0,
        deaths: 0,
        avgAge: 0
    },
    meta: {
        lastUpdate: Date.now()
    }
};


/* ======================================================
    🔥 AUTOSAVE + LOCAL STORAGE
   ====================================================== */

function saveLocal() {
    DB.meta.lastUpdate = Date.now();
    localStorage.setItem("quail_pro_mode", JSON.stringify(DB));
    setStatus("💾 Дані збережено локально");
}

function loadLocal() {
    let saved = localStorage.getItem("quail_pro_mode");
    if (saved) {
        DB = JSON.parse(saved);
        setStatus("Локальна база даних завантажена");
    } else {
        setStatus("Локальна база відсутня");
    }
}

function autosave() {
    saveLocal();
}

function setStatus(msg) {
    document.getElementById("statusBar").textContent = "Статус: " + msg;
}


/* ======================================================
   🔥 OFFLINE QUEUE (зберігаємо дії для Drive)
   ====================================================== */

let offlineQueue = [];

function queueAction(action) {
    offlineQueue.push(action);
    saveLocal();
}

/* ======================================================
   🔥 GOOGLE DRIVE AUTH + SYNC
   ====================================================== */

const CLIENT_ID = "764633127034-9t077tdhl7t1bcrsvml5nlil9vitdool.apps.googleusercontent.com";
const API_KEY = "AIzaSy...";     // ← вставиш свій
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
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
    });
    gapiInited = true;
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: ""
    });
    gisInited = true;
}

function loginGoogle() {
    tokenClient.callback = (resp) => {
        if (resp.error) throw resp;
        setStatus("Успішний вхід у Google");
        uploadToDrive();
    };
    tokenClient.requestAccessToken();
}


/* ======================================================
   🔥 DRIVE BACKUP (UPLOAD)
   ====================================================== */
async function uploadToDrive() {
    setStatus("Синхронізація з Drive…");

    let fileContent = JSON.stringify(DB, null, 2);
    let blob = new Blob([fileContent], { type: "application/json" });

    let metadata = {
        name: "quail_data.json",
        mimeType: "application/json"
    };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", blob);

    const res = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
            method: "POST",
            headers: new Headers({ Authorization: "Bearer " + gapi.client.getToken().access_token }),
            body: form
        }
    );

    if (res.status === 200 || res.status === 201) {
        setStatus("☁ Бекап створено у Drive");
    } else {
        setStatus("Помилка Drive");
    }
}


/* ======================================================
   🔥 RESTORE (DOWNLOAD)
   ====================================================== */
async function restoreFromDrive() {
    setStatus("Завантаження даних із Drive…");

    let result = await gapi.client.drive.files.list({
        q: "name='quail_data.json'",
        fields: "files(id, name)"
    });

    if (!result.result.files.length) {
        setStatus("Файл не знайдено");
        return;
    }

    let fileId = result.result.files[0].id;

    let download = await gapi.client.drive.files.get({
        fileId: fileId,
        alt: "media"
    });

    DB = JSON.parse(download.body);
    saveLocal();
    setStatus("Дані відновлено");
    renderAll();
}


/* ======================================================
   🔥 AUTOSYNC WHEN ONLINE
   ====================================================== */

window.addEventListener("online", () => {
    setStatus("Online — синхронізація…");
    if (offlineQueue.length > 0) {
        uploadToDrive();
        offlineQueue = [];
        saveLocal();
    }
});

window.addEventListener("offline", () => {
    setStatus("offline");
});


/* ======================================================
   🔥 SECTION RENDERERS
   ====================================================== */

function renderAll() {
    renderFeed();
    renderEggs();
    renderOrders();
    renderClients();
    renderFinance();
    renderInc();
    renderFlock();
}

/* === Feed === */

function recalcFeed() {
    autosave();
    renderFeed();
}

function renderFeed() {
    // твоя логіка розрахунку, вона підключиться сама
}

/* === Eggs === */

function recalcEggsBalance() {
    autosave();
    renderEggs();
}

function recalcProductivity() {
    autosave();
    renderEggs();
}

function renderEggs() { }

/* === Orders === */

function addOrder() {
    DB.orders.active.push({
        name: document.getElementById("ordName").value,
        eggs: Number(ordEggs.value),
        trays: Number(ordTrays.value),
        date: ordDate.value,
        note: ordNote.value,
        id: Date.now()
    });

    autosave();
    renderOrders();
}

function renderOrders() { }

/* === Clients === */

function renderClients() { }

/* === Finance === */

function addLog() {
    DB.finance.logs.push({
        date: logDate.value,
        category: logCategory.value,
        amount: Number(logAmount.value),
        comment: logComment.value
    });

    autosave();
    renderFinance();
}

function renderFinance() { }

/* === Incubation === */

function addIncubationBatch() {
    DB.incub.batches.push({
        name: incBatchName.value,
        start: incStartDate.value,
        eggs: Number(incEggsSet.value),
        note: incNote.value,
        id: Date.now()
    });

    autosave();
    renderInc();
}

function renderInc() { }

/* === Flock === */

function recalcFlock() {
    DB.flock.males = Number(males.value);
    DB.flock.females = Number(females.value);
    DB.flock.deaths = Number(deaths.value);
    DB.flock.avgAge = Number(avgAge.value);

    autosave();
    renderFlock();
}

function renderFlock() { }

/* ======================================================
   STARTUP
   ====================================================== */

window.onload = function () {
    loadLocal();
    renderAll();

    document.getElementById("saveLocal").onclick = saveLocal;
    document.getElementById("backupDrive").onclick = uploadToDrive;
    document.getElementById("restoreDrive").onclick = restoreFromDrive;
    document.getElementById("btnDriveLogin").onclick = loginGoogle;

    document.getElementById("addIncubation").onclick = addIncubationBatch;
};