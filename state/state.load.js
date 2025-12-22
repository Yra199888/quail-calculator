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
 * - ламає структуру (ensureState робить своє)
 */

import { AppState } from "./AppState.js";
import {
  loadStateFromCloud,
  subscribeToCloudState
} from "../firebase/firebase.js";

const STORAGE_KEY = "AppState";

/**
 * 📥 Завантажити стан
 */
export async function loadState() {
  let loaded = false;

  // -------------------------------
  // 1️⃣ Firebase (основне джерело)
  // -------------------------------
  try {
    const cloudState = await loadStateFromCloud();

    if (cloudState && typeof cloudState === "object") {
      Object.assign(AppState, cloudState);
      loaded = true;
      console.log("☁ AppState завантажено з Firebase");
    }
  } catch (err) {
    console.warn("⚠ Firebase load error, fallback → localStorage", err);
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
  // 3️⃣ Realtime sync (Firestore)
  // -------------------------------
  try {
    subscribeToCloudState((remoteState) => {
      if (!remoteState || typeof remoteState !== "object") return;

      console.log("🔄 Realtime update з Firebase");

      // 🔥 БЕЗПЕЧНО:
      // - НЕ чистимо AppState
      // - просто оновлюємо поля
      Object.assign(AppState, remoteState);

      // сигнал UI
      window.dispatchEvent(new Event("appstate:updated"));
    });
  } catch (err) {
    console.warn("⚠ Realtime sync не активний", err);
  }
}