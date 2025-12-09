/* ============================================================
   GOOGLE DRIVE — FULL PRO BACKUP MODE
   Автоматичне збереження та відновлення data.json
   Працює офлайн + синхронізація при появі мережі
============================================================ */

import { DATA, loadLocal, saveLocal, autosave } from "./storage.js";
import { applyAllRenders } from "../modules/render.js";

/* ------------------------------------------------------------
   ТВОЇ ДАНІ АВТОРИЗАЦІЇ
------------------------------------------------------------ */

const CLIENT_ID = "764633127034-9t077tdhl7t1bcrsvml5nlil9vitdool.apps.googleusercontent.com";
const API_KEY = "AIzaSyD-placeholder"; // можна залишити заглушку
const SCOPES = "https://www.googleapis.com/auth/drive.file";
let tokenClient;
let gapiInited = false;
let gisInited = false;

/* ------------------------------------------------------------
   1. LOAD GAPI
------------------------------------------------------------ */

export function gapiLoaded() {
    gapi.load("client", initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
    });
    gapiInited = true;
    maybeEnableButtons();
}

/* ------------------------------------------------------------
   2. LOAD GIS (Google Identity)
------------------------------------------------------------ */

export function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: "",
    });
    gisInited = true;
    maybeEnableButtons();
}

/* ------------------------------------------------------------
   3. ENABLE UI BUTTONS WHEN READY
------------------------------------------------------------ */

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById("btnDriveLogin").disabled = false;
        document.getElementById("btnBackup").disabled = false;
        document.getElementById("btnRestore").disabled = false;
    }
}

/* ------------------------------------------------------------
   4. LOGIN TO GOOGLE
------------------------------------------------------------ */

export function driveLogin() {
    tokenClient.callback = (resp) => {
        if (resp.error) throw resp;
        document.getElementById("driveStatus").innerText = "Увійшли ✔";
    };
    tokenClient.requestAccessToken({ prompt: "consent" });
}

/* ------------------------------------------------------------
   5. CREATE BACKUP (UPLOAD data.json)
------------------------------------------------------------ */

export async function driveBackup() {
    try {
        const fileContent = JSON.stringify(DATA, null, 2);
        const file = new Blob([fileContent], { type: "application/json" });

        const metadata = {
            name: "quail_data.json",
            mimeType: "application/json",
        };

        const form = new FormData();
        form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
        form.append("file", file);

        const res = await fetch(
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
            {
                method: "POST",
                headers: new Headers({ Authorization: "Bearer " + gapi.client.getToken().access_token }),
                body: form,
            }
        );

        document.getElementById("driveStatus").innerText = "Створено резервну копію ✔";
    }
    catch (e) {
        console.error(e);
        document.getElementById("driveStatus").innerText = "Помилка створення";
    }
}

/* ------------------------------------------------------------
   6. RESTORE BACKUP (DOWNLOAD data.json)
------------------------------------------------------------ */

export async function driveRestore() {
    try {
        const list = await gapi.client.drive.files.list({
            q: "name='quail_data.json'",
            fields: "files(id, name)",
        });

        if (!list.result.files.length) {
            document.getElementById("driveStatus").innerText = "Файл не знайдено";
            return;
        }

        const fileId = list.result.files[0].id;

        const res = await gapi.client.drive.files.get({
            fileId,
            alt: "media",
        });

        const json = res.result;

        Object.assign(DATA, json);
        saveLocal();
        applyAllRenders();

        document.getElementById("driveStatus").innerText = "Відновлено ✔";
    }
    catch (e) {
        console.error(e);
        document.getElementById("driveStatus").innerText = "Помилка відновлення";
    }
}

/* ------------------------------------------------------------
   7. AUTO-SYNC (PRO MODE)
------------------------------------------------------------ */

export function autoSyncToDrive() {
    if (!navigator.onLine) return;

    // Якщо токена немає → не можемо синхронізувати
    if (!gapi.client.getToken()) return;

    driveBackup();
}

/* ------------------------------------------------------------
   8. INIT — запускається в app.js
------------------------------------------------------------ */

export function initDrive() {
    document.getElementById("btnDriveLogin").onclick = driveLogin;
    document.getElementById("btnBackup").onclick = driveBackup;
    document.getElementById("btnRestore").onclick = driveRestore;

    window.addEventListener("online", () => {
        document.getElementById("driveStatus").innerText = "Online — синхронізую…";
        autoSyncToDrive();
    });

    window.addEventListener("offline", () => {
        document.getElementById("driveStatus").innerText = "Offline — збережено локально";
    });
}