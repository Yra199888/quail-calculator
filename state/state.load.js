// state/state.load.js
import { AppState } from "./AppState.js";
import { ensureAppState } from "./state.ensure.js";

const STORAGE_KEY = "AppState";

export function loadAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      ensureAppState();
      return;
    }

    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") {
      ensureAppState();
      return;
    }

    // shallow merge — структура вже є
    Object.assign(AppState, data);

    ensureAppState();
  } catch (err) {
    console.error("❌ loadAppState failed", err);
    ensureAppState();
  }
}