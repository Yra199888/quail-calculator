// APP JS — FULL PRO MODE
// Ти вставиш повний код у ЧАСТИНІ 2

/* ============================================================
   PRO MODE — OFFLINE, ONLINE SYNC, BACKUP, AUTO-SAVE
============================================================ */

const LS_KEY = "quail-data-pro";

// === 1. Автозбереження при вводі ===
window.addEventListener("input", () => {
    saveLocal();
});

// === 2. Автозбереження при закритті вкладки ===
window.addEventListener("beforeunload", () => {
    saveLocal();
});

// === 3. Зміна статусу мережі ===
function updateNetworkStatus() {
    const status = navigator.onLine ? "🟢 Онлайн" : "🔴 Офлайн";
    document.getElementById("statusBar").innerText = "Статус: " + status;
}
window.addEventListener("online", updateNetworkStatus);
window.addEventListener("offline", updateNetworkStatus);
updateNetworkStatus();

// === 4. Збереження локально ===
function saveLocal() {
    const data = {
        timestamp: Date.now(),
        eggsToday: document.getElementById("eggsToday")?.value || null,
        custom: "далі ти впишеш структуру"
    };

    localStorage.setItem(LS_KEY, JSON.stringify(data));
    console.log("Local saved");
}

// === 5. Реєстрація service worker ===
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
        .then(() => console.log("SW registered"))
        .catch(console.error);
}

// === 6. Google Drive AUTH ===
let tokenClient;

function initGoogle() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: "764633127034-9t077tdhl7t1bcrsvml5nlil9vitdool.apps.googleusercontent.com",
        scope: "https://www.googleapis.com/auth/drive.file",
        callback: ""
    });
}

// === 7. Backup to Drive ===
async function backupToDrive() {
    tokenClient.callback = async () => {
        const raw = localStorage.getItem(LS_KEY);
        const blob = new Blob([raw], { type: "application/json" });

        const metadata = { name: "quail-pro-backup.json" };

        const form = new FormData();
        form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
        form.append("file", blob);

        await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
            method: "POST",
            headers: { "Authorization": "Bearer " + gapi.client.getToken().access_token },
            body: form
        });

        alert("☁ Резервна копія створена");
    };

    tokenClient.requestAccessToken({ prompt: "consent" });
}

document.getElementById("backupDrive").onclick = backupToDrive;

// === 8. Restore ===
async function restoreFromDrive() {
    tokenClient.callback = async () => {
        const res = await gapi.client.drive.files.list({
            q: "name='quail-pro-backup.json'",
            fields: "files(id)"
        });

        if (!res.result.files.length) return alert("Немає копій");

        const fileId = res.result.files[0].id;

        const file = await gapi.client.drive.files.get({ fileId, alt: "media" });

        localStorage.setItem(LS_KEY, file.body);
        alert("🔄 Відновлено");

        location.reload();
    };

    tokenClient.requestAccessToken({ prompt: "consent" });
}

document.getElementById("restoreDrive").onclick = restoreFromDrive;

window.onload = () => {
    updateNetworkStatus();
    initGoogle();
};
