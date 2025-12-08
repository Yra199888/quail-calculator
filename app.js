/* ============================================================
   QUAIL CALCULATOR — PRO MODE (A) 
   ЄДИНИЙ data.json + Offline Sync + Drive Backup
   Автор: GPT + Юрій :)
===============================================================*/

/* ============================================================
   0. Глобальні змінні
===============================================================*/

let DATA = {
    feed: {
        batchKg: 25,
        recipe: {},         // % компоненти
        stocks: {},         // запаси
        readyKg: 0,         // готовий комбікорм
        birds: 0,
        dailyPerHen: 30     // г/добу
    },

    eggs: {
        total: 0,
        bad: 0,
        own: 0,
        carry: 0,
        traysPrice: 0,
        hens1: 0,
        hens2: 0,
        history: []         // [{date, total, bad, own, sale, trays}]
    },

    orders: {
        active: [],
        done: []
    },

    clients: {},             // статистика клієнтів

    finance: {
        logs: [],            // {date, category, amount, comment}
        otherCostsMonthly: 0
    },

    incub: [],               // партії інкубації

    flock: {
        males: 0,
        females: 0,
        deaths: 0,
        avgAge: 0
    }
};


/* ============================================================
   1. Завантаження + Автозбереження
===============================================================*/

function loadData() {
    try {
        let saved = localStorage.getItem("quail_pro_data");
        if (saved) DATA = JSON.parse(saved);
    } catch (e) { console.error("Помилка завантаження", e); }

    renderAll();
}

function saveData() {
    localStorage.setItem("quail_pro_data", JSON.stringify(DATA));
    scheduleSyncUpload();
}

/* Автозбереження при будь-якій зміні інпутів */
document.addEventListener("input", saveData);


/* ============================================================
   2. Offline Sync Queue — черга дій
===============================================================*/

let syncQueue = JSON.parse(localStorage.getItem("syncQueue") || "[]");

function scheduleSyncUpload() {
    syncQueue.push({ time: Date.now(), data: DATA });
    localStorage.setItem("syncQueue", JSON.stringify(syncQueue));
    trySyncUpload();
}

function trySyncUpload() {
    if (!navigator.onLine) return;

    if (syncQueue.length > 0) {
        console.log("Синхронізую зміну…");
        uploadToDrive(DATA, () => {
            syncQueue = [];
            localStorage.setItem("syncQueue", "[]");
        });
    }
}

window.addEventListener("online", trySyncUpload);


/* ============================================================
   3. Google Drive FULL PRO MODE
===============================================================*/

let tokenClient;
let gapiInited = false;
let gisInited = false;
let DRIVE_FILE_ID = null;

function gapiLoaded() {
    gapi.load("client", initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: "",
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    });
    gapiInited = true;
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: "764633127034-9t077tdhl7t1bcrsvml5nlil9vitdool.apps.googleusercontent.com",
        scope: "https://www.googleapis.com/auth/drive.file",
        callback: "",
    });
    gisInited = true;
}

document.getElementById("btnDriveLogin").onclick = () => {
    tokenClient.callback = (resp) => {
        if (resp.access_token) {
            document.getElementById("driveStatus").innerText = "Увійшли в Google ✔";
        }
    };
    tokenClient.requestAccessToken();
};


/* === Створити резервну копію === */
document.getElementById("btnBackup").onclick = () => {
    uploadToDrive(DATA, () => {
        document.getElementById("driveStatus").innerText = "Бекап створено ✔";
    });
};

async function uploadToDrive(json, callback) {
    const fileContent = JSON.stringify(json);
    const metadata = {
        name: "quail_data.json",
        mimeType: "application/json",
    };

    const boundary = "-------314159265358979323846";
    let body =
        "--" + boundary + "\r\n" +
        "Content-Type: application/json\r\n\r\n" +
        JSON.stringify(metadata) + "\r\n" +
        "--" + boundary + "\r\n" +
        "Content-Type: application/json\r\n\r\n" +
        fileContent + "\r\n" +
        "--" + boundary + "--";

    await gapi.client.request({
        path: "/upload/drive/v3/files?uploadType=multipart",
        method: "POST",
        headers: {
            "Content-Type": "multipart/related; boundary=" + boundary,
        },
        body: body,
    });

    if (callback) callback();
}


/* === Відновити резервну копію === */
document.getElementById("btnRestore").onclick = async () => {
    let list = await gapi.client.drive.files.list({
        q: "name='quail_data.json'",
        fields: "files(id,name)"
    });

    if (!list.result.files.length) {
        alert("Файл не знайдено у Drive");
        return;
    }

    let id = list.result.files[0].id;

    let file = await gapi.client.drive.files.get({
        fileId: id,
        alt: "media"
    });

    DATA = JSON.parse(file.body);
    saveData();
    renderAll();

    document.getElementById("driveStatus").innerText = "Дані відновлено ✔";
};


/* ============================================================
   4. Локальні резервні копії
===============================================================*/

function exportLocalBackup() {
    let blob = new Blob([JSON.stringify(DATA)], { type: "application/json" });
    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = "quail_backup.json";
    a.click();
}

function importLocalBackup(ev) {
    let file = ev.target.files[0];
    let reader = new FileReader();

    reader.onload = function () {
        DATA = JSON.parse(reader.result);
        saveData();
        renderAll();
    };

    reader.readAsText(file);
}


/* ============================================================
   5. Основні розрахункові функції
===============================================================*/

/* ——— КОРМ ————————————————————— */

function recalcFeed() {
    let kg = Number(document.getElementById("feedBatchKg")?.value || 25);
    let rows = document.getElementById("feedTableRows");
    if (!rows) return;

    rows.innerHTML = "";

    let totalKg = 0;

    for (let comp in DATA.feed.recipe) {
        let percent = DATA.feed.recipe[comp];
        let amount = kg * percent / 100;

        totalKg += amount;

        rows.innerHTML += `
           <tr>
             <td>${comp}</td>
             <td>${percent}%</td>
             <td>${amount.toFixed(2)} кг</td>
           </tr>`;
    }

    DATA.feed.batchKg = kg;
    saveData();
}

document.getElementById("produceFeedBatch")?.addEventListener("click", () => {
    DATA.feed.readyKg += DATA.feed.batchKg;
    saveData();
    renderFeedStock();
});

document.getElementById("consumeDailyFeed")?.addEventListener("click", () => {
    let birds = DATA.feed.birds;
    let daily = DATA.feed.dailyPerHen;

    let needKg = (birds * daily) / 1000;
    DATA.feed.readyKg -= needKg;
    if (DATA.feed.readyKg < 0) DATA.feed.readyKg = 0;

    saveData();
    renderFeedStock();
});


function renderFeedStock() {
    let remain = document.getElementById("feedStockRemain");
    let days = document.getElementById("feedDaysLeft");

    if (!remain) return;

    remain.innerText = DATA.feed.readyKg.toFixed(2);

    let dailyKg = (DATA.feed.birds * DATA.feed.dailyPerHen) / 1000;

    days.innerText = dailyKg > 0 ? Math.floor(DATA.feed.readyKg / dailyKg) : 0;
}


/* ——— ЯЙЦЯ ————————————————————— */

function recalcEggsBalance() {
    let e = DATA.eggs;

    e.total = Number(document.getElementById("eggsTotal").value || 0);
    e.bad = Number(document.getElementById("eggsBad").value || 0);
    e.own = Number(document.getElementById("eggsOwn").value || 0);
    e.carry = Number(document.getElementById("eggsCarry").value || 0);

    let sale = e.total - e.bad - e.own;
    if (sale < 0) sale = 0;

    let totalSale = sale + e.carry;
    let trays = Math.floor(totalSale / 20);
    let rem = totalSale % 20;

    document.getElementById("eggsForSale").innerText = sale;
    document.getElementById("eggsForSaleTotal").innerText = totalSale;
    document.getElementById("traysCount").innerText = trays;
    document.getElementById("eggsRemainder").innerText = rem;

    DATA.eggs.history.push({
        date: new Date().toISOString().slice(0, 10),
        sale,
        total: e.total
    });

    saveData();
}


/* ——— ЗАМОВЛЕННЯ ————————————————————— */

function addOrder() {
    let name = ordName.value;
    let trays = Number(ordTrays.value);
    let eggs = Number(ordEggs.value);
    let date = ordDate.value;

    DATA.orders.active.push({
        id: Date.now(),
        name,
        trays,
        eggs,
        date,
        note: ordNote.value
    });

    saveData();
    renderOrders();
}

function completeOrder(id) {
    let idx = DATA.orders.active.findIndex(o => o.id === id);
    if (idx >= 0) {
        let ord = DATA.orders.active.splice(idx, 1)[0];
        DATA.orders.done.push(ord);
        saveData();
        renderOrders();
    }
}

function renderOrders() {
    let act = document.getElementById("ordersActive");
    if (!act) return;

    act.innerHTML = "";
    DATA.orders.active.forEach(o => {
        act.innerHTML += `
          <tr>
            <td>${o.name}</td>
            <td>${o.trays}</td>
            <td>${o.eggs}</td>
            <td>${o.date}</td>
            <td><button onclick="completeOrder(${o.id})">✔</button></td>
          </tr>`;
    });

    let done = document.getElementById("ordersDone");
    done.innerHTML = "";
    DATA.orders.done.forEach(o => {
        done.innerHTML += `<tr><td>${o.name}</td><td>${o.trays}</td><td>${o.eggs}</td><td>${o.date}</td></tr>`;
    });
}


/* ——— ІНКУБАЦІЯ ————————————————————— */

document.getElementById("addIncubation")?.addEventListener("click", () => {
    DATA.incub.push({
        id: Date.now(),
        name: incBatchName.value,
        date: incStartDate.value,
        eggs: Number(incEggsSet.value),
        note: incNote.value,
        infertile: 0,
        hatched: 0,
        diedInc: 0,
        diedBrooder: 0
    });
    saveData();
    renderInc();
});

function renderInc() {
    let body = document.getElementById("incubationBody");
    if (!body) return;

    body.innerHTML = "";

    let filter = document.getElementById("incFilter").value;

    DATA.incub.forEach(p => {
        body.innerHTML += `
          <tr>
            <td>${p.name}</td>
            <td>${p.date}</td>
            <td>${daysSince(p.date)}</td>
            <td>${p.eggs}</td>
            <td>${p.infertile}</td>
            <td>${p.hatched}</td>
            <td>${p.diedInc}</td>
            <td>${p.diedBrooder}</td>
            <td>${p.eggs - p.infertile - p.diedInc - p.diedBrooder}</td>
            <td></td>
            <td>${p.note || ""}</td>
            <td></td>
          </tr>`;
    });
}

function daysSince(dateStr) {
    let d = new Date(dateStr);
    let now = new Date();
    return Math.floor((now - d) / 86400000);
}


/* ============================================================
   6. Рендер усіх секцій
===============================================================*/

function renderAll() {
    renderFeedStock();
    renderOrders();
    renderInc();
    recalcEggsBalance();
}


/* ============================================================
   7. Запуск
===============================================================*/

loadData();
trySyncUpload();


console.log("PRO MODE app.js завантажено ✔");