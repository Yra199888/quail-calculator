/**
 * 🔥 firebase.js
 * Робота з Firebase Cloud Firestore
 *
 * ❌ НЕ:
 * - рендерить UI
 * - змінює AppState напряму
 *
 * ✅ ТІЛЬКИ:
 * - load
 * - save
 * - realtime subscribe
 */

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import { AppState } from "../state/AppState.js";

// ---------------------------------------
// FIRESTORE INIT
// ---------------------------------------
const db = getFirestore();

// 👉 Один документ = один AppState
// Можна змінити userId пізніше (auth)
const STATE_DOC = doc(db, "appState", "default");

// ---------------------------------------
// 💾 SAVE TO CLOUD
// ---------------------------------------
export async function saveStateToCloud() {
  try {
    await setDoc(STATE_DOC, {
      data: JSON.parse(JSON.stringify(AppState)),
      updatedAt: Date.now()
    });

    console.log("☁ AppState збережено в Firebase");
  } catch (err) {
    console.error("❌ Firebase save error:", err);
  }
}

// ---------------------------------------
// 📥 LOAD FROM CLOUD
// ---------------------------------------
export async function loadStateFromCloud() {
  try {
    const snap = await getDoc(STATE_DOC);

    if (!snap.exists()) {
      console.log("ℹ Firebase: стану ще немає");
      return null;
    }

    const payload = snap.data();

    if (!payload?.data) return null;

    return payload.data;
  } catch (err) {
    console.error("❌ Firebase load error:", err);
    return null;
  }
}

// ---------------------------------------
// 🔄 REALTIME SYNC
// ---------------------------------------
export function subscribeToCloudState(onUpdate) {
  return onSnapshot(STATE_DOC, (snap) => {
    if (!snap.exists()) return;

    const payload = snap.data();
    if (!payload?.data) return;

    onUpdate(payload.data);
  });
}