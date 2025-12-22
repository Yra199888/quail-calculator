/**
 * 💾 state.save.js
 * ---------------------------------------
 * Збереження AppState
 *
 * ✅ localStorage (offline / fallback)
 * ✅ Firebase Cloud Firestore (online sync, SAFE)
 *
 * ❌ НЕ:
 * - змінює стан
 * - викликає UI
 * - перевіряє структуру
 */

import { AppState } from "./AppState.js";
import { saveStateToCloud } from "../firebase/firebase.js";

const STORAGE_KEY = "AppState";

// 🛑 захист від паралельних збережень
let savingInProgress = false;

/**
 * 💾 Зберегти поточний стан
 */
export async function saveState() {
  // ----------------------------------
  // 🧱 0️⃣ Захист
  // ----------------------------------
  if (savingInProgress) return;
  if (!AppState || typeof AppState !== "object") return;

  savingInProgress = true;

  // ----------------------------------
  // 1️⃣ localStorage (миттєво)
  // ----------------------------------
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(AppState));
  } catch (err) {
    console.error("❌ Помилка збереження AppState у localStorage:", err);
  }

  // ----------------------------------
  // 2️⃣ Firebase Cloud (transaction)
  // ----------------------------------
  try {
    await saveStateToCloud(AppState);
  } catch (err) {
    console.warn("⚠ Firebase недоступний, працюємо локально", err);
  } finally {
    savingInProgress = false;
  }
}