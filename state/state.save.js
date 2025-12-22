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
 * 💾 Зберегти поточний стан
 */
export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(AppState));
  } catch (err) {
    console.error("❌ Помилка збереження AppState:", err);
  }
}