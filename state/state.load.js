/**
 * 📥 state.load.js
 * Завантаження AppState
 *
 * Пріоритет:
 * 1️⃣ Firebase Cloud Firestore
 * 2️⃣ localStorage (fallback)
 *
 * ❌ НЕ:
 * - рендерить UI
 * - змінює структуру (це робить ensureState)
 */

import { AppState } from "./AppState.js";
import { loadStateFromCloud, subscribeToCloudState } from "../firebase/firebase.js";

const STORAGE_KEY = "AppState";

/**
 * 📥 Завантажити стан
 */
export async function loadState() {
  let loaded = false;

  // -------------------------------
  // 1️⃣ Firebase
  // -------------------------------
  try {
    const cloudState = await loadStateFromCloud();

    if (cloudState && typeof cloudState === "object") {
      Object.assign(AppState, cloudState);
      loaded = true;
      console.log("☁ AppState завантажено з Firebase");
    }
  } catch (err) {
    console.warn("⚠ Firebase недоступний, fallback → localStorage", err);
  }

  // -------------------------------
  // 2️⃣ localStorage (fallback)
  // -------------------------------
  if (!loaded) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        Object.assign(AppState, JSON.parse(raw));
        console.log("💾 AppState завантажено з localStorage");
      }
    } catch (err) {
      console.error("❌ Помилка читання localStorage:", err);
    }
  }

  // -------------------------------
  // 3️⃣ Realtime sync (ПІСЛЯ load)
  // -------------------------------
  try {
    subscribeToCloudState((remoteState) => {
      if (!remoteState) return;

      console.log("🔄 Оновлення AppState з Firebase");

      Object.keys(AppState).forEach(k => delete AppState[k]);
      Object.assign(AppState, remoteState);

      // UI оновиться автоматично через renderAll()
      window.dispatchEvent(new Event("appstate:updated"));
    });
  } catch (err) {
    console.warn("⚠ Realtime sync не активний", err);
  }
}