/* ============================
   core/drive.js
   Google Drive BACKUP / RESTORE
============================ */

let GOOGLE_TOKEN = null;

/* --- Авторизація --- */
async function googleLogin() {
    return new Promise((resolve, reject) => {
        google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: "https://www.googleapis.com/auth/drive.file",
            callback: (token) => {
                GOOGLE_TOKEN = token.access_token;
                document.getElementById("googleStatus").textContent = "Увійшов ✓";
                resolve(token);
            }
        }).requestAccessToken();
    });
}

/* --- Збереження на Google Drive --- */
async function driveBackup() {
    if (!GOOGLE_TOKEN) await googleLogin();
    console.log("Створюю резервну копію на Google Drive…");

    const file = new Blob([JSON.stringify(DATA)], { type: "application/json" });

    await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=media", {
        method: "POST",
        headers: { Authorization: `Bearer ${GOOGLE_TOKEN}` },
        body: file
    });

    alert("Резервна копія створена ✓");
}

/* --- Відновлення --- */
async function driveRestore() {
    alert("PRO MODE: тут буде читання файлу з Drive (версія 2)");
}