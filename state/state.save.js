// src/state/state.save.js

import { AppState } from "./AppState.js";

const STORAGE_KEY = "AppState";

/**
 * Зберігає AppState в localStorage
 * ❗ Без логіки
 * ❗ Без мутацій
 * ❗ Без перевірок структури
 */
export function saveAppState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(AppState));
  } catch (err) {
    console.error("❌ saveAppState failed:", err);
  }
}