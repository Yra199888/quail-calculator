// src/state/state.load.js

import { AppState } from "./AppState.js";

const STORAGE_KEY = "AppState";

/**
 * Завантажує AppState з localStorage
 * ❗ НІЧОГО не створює
 * ❗ НІЧОГО не перевіряє
 * ❗ ТІЛЬКИ merge
 */
export function loadAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return;

    deepMerge(AppState, saved);
  } catch (err) {
    console.error("❌ loadAppState failed:", err);
  }
}

/**
 * Глибоке злиття без видалення дефолтних ключів
 * target = AppState
 * source = saved from storage
 */
function deepMerge(target, source) {
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      target[key]
    ) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}