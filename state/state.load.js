/**
 * 📥 state.load.js
 * Завантаження AppState з localStorage
 *
 * ❗ Файл НЕ:
 * - виправляє структуру
 * - не валідовує
 * - не рендерить
 *
 * Він ТІЛЬКИ читає дані
 */

import { AppState } from "./AppState.js";

const STORAGE_KEY = "AppState";

/**
 * 🔹 Завантажити стан з localStorage
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      // нічого не збережено — працюємо з чистим AppState
      return;
    }

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      console.warn("⚠️ AppState у localStorage некоректний, ігноруємо");
      return;
    }

    // обережно мержимо тільки верхній рівень
    Object.assign(AppState, parsed);

  } catch (err) {
    console.error("❌ Помилка завантаження AppState:", err);
  }
}