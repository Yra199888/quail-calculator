/* ============================
   core/storage.js
   LocalStorage + AUTOSAVE
============================ */

const STORAGE_KEY = "quail_pro_data_v1";

/* --- Завантаження даних --- */
function loadLocal() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        return JSON.parse(raw);
    } catch (e) {
        console.error("Помилка читання localStorage:", e);
        return {};
    }
}

/* --- Збереження --- */
function saveLocal() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA));
    } catch (e) {
        console.error("Помилка запису localStorage:", e);
    }
}

/* --- AUTOSAVE кожні 3 секунди --- */
let autosaveTimer = null;

function autosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(saveLocal, 3000);
}

/* --- Автозбереження при закритті вкладки --- */
window.addEventListener("beforeunload", saveLocal);