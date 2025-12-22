/**
 * 💾 state.save.js
 * ---------------------------------------
 * Збереження AppState
 *
 * ✅ localStorage (offline / fallback)
 * ✅ Firebase Cloud Firestore (online sync)
 *
 * ❌ НЕ:
 * - змінює стан
 * - викликає UI
 * - перевіряє структуру
 */

import { AppState } from "./AppState.js";
import { saveStateToCloud } from "../firebase/firebase.js";

const STORAGE_KEY = "AppState";

/**
 * 💾 Зберегти поточний стан
 */
export async function saveState() {
  // -------------------------------
  // 1️⃣ LocalStorage (офлайн, як було)
  // -------------------------------
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(AppState));
  } catch (err) {
    console.error("❌ Помилка збереження AppState у localStorage:", err);
  }

  // -------------------------------
  // 2️⃣ Firebase Cloud (онлайн sync)
  // -------------------------------
  try {
    // 🔴 ВАЖЛИВО: передаємо AppState
    await saveStateToCloud(AppState);
  } catch (err) {
    console.warn("⚠ Firebase недоступний, працюємо локально", err);
  }
}