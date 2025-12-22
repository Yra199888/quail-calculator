/**
 * 📥 state.load.js
 * ---------------------------------------
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
import {
  loadStateFromCloud,
  subscribeToCloudState,
  isFirebaseReady
} from "../firebase/firebase.js";

const STORAGE_KEY = "AppState";

/**
 * 📥 Завантажити стан
 */
export async function loadState() {
  let loadedFrom = null;

  // -------------------------------
  // 1️⃣ Firebase (якщо доступний)
  // -------------------------------
  if (isFirebaseReady()) {
    try {
      const cloudState = await loadStateFromCloud();

      if (cloudState && typeof cloudState === "object") {
        Object.assign(AppState, cloudState);
        loadedFrom = "cloud";
        console.log("☁ AppState завантажено з Firebase");
      }
    } catch (err) {
      console.warn("⚠ Firebase load error, fallback → localStorage", err);
    }
  }

  // -------------------------------
  // 2️⃣ localStorage (fallback)
  // -------------------------------
  if (!loadedFrom) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        Object.assign(AppState, JSON.parse(raw));
        loadedFrom = "local";
        console.log("💾 AppState завантажено з localStorage");
      }
    } catch (err) {
      console.error("❌ Помилка читання localStorage:", err);
    }
  }

  // -------------------------------
  // 3️⃣ Realtime sync (ТІЛЬКИ якщо Firebase готовий)
  // -------------------------------
  if (isFirebaseReady()) {
    try {
      subscribeToCloudState((remoteState) => {
        if (!remoteState || typeof remoteState !== "object") return;

        console.log("🔄 Realtime update з Firebase");

        // акуратна заміна state
        Object.keys(AppState).forEach(k => delete AppState[k]);
        Object.assign(AppState, remoteState);

        // сигнал для UI
        window.dispatchEvent(new Event("appstate:updated"));
      });
    } catch (err) {
      console.warn("⚠ Realtime sync не активний", err);
    }
  }
}