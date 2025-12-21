/**
 * 💾 state.save.js
 * Збереження AppState у localStorage
 *
 * ❗ Файл НЕ:
 * - змінює стан
 * - перевіряє структуру
 * - викликає UI
 *
 * Він ТІЛЬКИ зберігає
 */

import { AppState } from "./AppState.js";

const STORAGE_KEY = "AppState";

/**
 * 🔹 Зберегти поточний AppState
 */
export function saveAppState() {
  try {
    const json = JSON.stringify(AppState);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (err) {
    console.error("❌ Помилка збереження AppState:", err);
  }
}