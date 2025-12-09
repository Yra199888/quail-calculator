/* ============================================================
   core/drive.js — FULL PRO MODE Google Drive Sync
   Відповідає за:
   - Авторизацію Google
   - Створення/оновлення файлу data.json у Drive
   - Завантаження резервної копії
   - Автосинхронізацію при зміні даних
============================================================ */

import { DATA, loadAllData, saveLocal, autosave } from "./storage.js";
import { syncQueue } from "./sync.js";

/* ------------------------------------------------------------
   0. Налаштування OAuth
------------------------------------------------------------ */

const CLIENT_ID = "764633127034-9t077tdhl7t1bcrsvml5nlil9vitdool.apps.googleusercontent.com";
const API_KEY = "";
const SCOPES = "https://www.googleapis.com/auth/drive.file";

let tokenClient = null;
let gapiInited = false;
let gisInited = false;

let driveFileId = null;

window.gapiLoaded = function () {
    gapi.load("client", initGapiClient);
};

async function initGapiClient() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
        });
        gapiInited = true;
        updateDriveStatus("Google API готове ✔");
    } catch (e) {
        updateDriveStatus("Помилка ініціалізації GAPI");
        console.error(e);
    }
}

window.gisLoaded = function () {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: "",
    });
    gisInited = true;
    updateDriveStatus("Google OAuth готове ✔");
};

/* ------------------------------------------------------------
   1. Авторизація Google
------------------------------------------------------------ */

export async function loginGoogle() {
    return new Promise((resolve, reject) => {
        if (!gisInited) return reject("GIS не ініціалізовано");

        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                updateDriveStatus("Помилка входу ❌");
                reject(resp);
                return;
            }
            updateDriveStatus("Успішний вхід ✔");
            resolve(resp);
        };

        tokenClient.requestAccessToken({ prompt: "consent" });
    });
}

/* ------------------------------------------------------------
   2. Пошук або створення файлу data.json у Drive
------------------------------------------------------------ */

async function getOrCreateDataFile() {
    // 1) шукаємо файл
    const res = await gapi.client.drive.files.list({
        q: "name='quail_data.json'",
        spaces: "drive",
    });

    if (res.result.files.length > 0) {
        driveFileId = res.result.files[0].id;
        return driveFileId;
    }

    // 2) створюємо, якщо не знайдено
    const createRes = await gapi.client.drive.files.create({
        resource: { name: "quail_data.json", mimeType: "application/json" },
        fields: "id",
    });

    driveFileId = createRes.result.id;
    return driveFileId;
}

/* ------------------------------------------------------------
   3. Завантаження резервної копії з Drive
------------------------------------------------------------ */

export async function restoreFromDrive() {
    try {
        await loginGoogle();
        const id = await getOrCreateDataFile();

        const file = await gapi.client.drive.files.get({
            fileId: id,
            alt: "media",
        });

        const json = JSON.parse(file.body);

        Object.assign(DATA, json);
        saveLocal();
        autosave();

        updateDriveStatus("Дані успішно відновлено ✔");
    } catch (e) {
        updateDriveStatus("Помилка відновлення ❌");
        console.error(e);
    }
}

/* ------------------------------------------------------------
   4. Резервне копіювання у Drive
------------------------------------------------------------ */

export async function backupToDrive() {
    try {
        await loginGoogle();
        const id = await getOrCreateDataFile();

        const fileContent = new Blob([JSON.stringify(DATA)], {
            type: "application/json",
        });

        await gapi.client.request({
            path: `/upload/drive/v3/files/${id}`,
            method: "PATCH",
            params: { uploadType: "media" },
            body: fileContent,
        });

        updateDriveStatus("Резервна копія створена ✔");
    } catch (e) {
        updateDriveStatus("Помилка резервного копіювання ❌");
        console.error(e);
    }
}

/* ------------------------------------------------------------
   5. Автосинхронізація змін через syncQueue
------------------------------------------------------------ */

export async function driveAutoSync() {
    if (!navigator.onLine) {
        updateDriveStatus("Офлайн — зміни у черзі");
        return;
    }

    if (!driveFileId) {
        try {
            await loginGoogle();
            await getOrCreateDataFile();
        } catch (e) {
            console.error("AutoSync login error:", e);
            return;
        }
    }

    while (syncQueue.length > 0) {
        updateDriveStatus("Синхронізація…");

        const op = syncQueue.shift();
        await backupToDrive();
    }

    updateDriveStatus("Синхронізовано ✔");
}

/* ------------------------------------------------------------
   6. Статус у інтерфейсі
------------------------------------------------------------ */

export function updateDriveStatus(text) {
    const el = document.getElementById("driveStatus");
    if (el) el.innerText = "Статус: " + text;
}

/* ------------------------------------------------------------
   7. Ініціалізація кнопок
------------------------------------------------------------ */

export function initDriveModule() {
    document.getElementById("btnDriveLogin").onclick = loginGoogle;
    document.getElementById("btnBackup").onclick = backupToDrive;
    document.getElementById("btnRestore").onclick = restoreFromDrive;
}