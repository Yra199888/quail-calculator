/**
 * 🔥 firebase.js
 * ---------------------------------------
 * ЄДИНЕ місце ініціалізації Firebase + Firestore
 *
 * ❗ ВАЖЛИВО:
 * - initializeApp() ТІЛЬКИ ТУТ
 * - getFirestore() ТІЛЬКИ ТУТ
 * - НІЯКОГО DOM
 * - НІЯКОГО AppState
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* =======================================
   🔑 FIREBASE CONFIG
   ======================================= */
const firebaseConfig = {
  apiKey: "AIzaSyDp_Vf7rPpGUNJROAGD-2o-fA-0Ux5VBZw",
  authDomain: "quail-farm-tracke.firebaseapp.com",
  projectId: "quail-farm-tracke",
  storageBucket: "quail-farm-tracke.firebasestorage.app",
  messagingSenderId: "914329630014",
  appId: "1:914329630014:web:ef1cce3719b6a0e1cea86f"
};

/* =======================================
   🚀 INIT FIREBASE (ОДИН РАЗ)
   ======================================= */
const app = initializeApp(firebaseConfig);

/* =======================================
   🧠 INIT FIRESTORE
   ======================================= */
export const db = getFirestore(app);

/* =======================================
   ☁️ CLOUD STORAGE HELPERS
   ======================================= */

/**
 * 💾 Зберегти стан у Firestore
 * @param {Object} state
 */
export async function saveStateToCloud(state) {
  if (!state) return;

  await setDoc(
    doc(db, "appState", "main"),
    JSON.parse(JSON.stringify(state)) // safe clone
  );
}

/**
 * 📥 Завантажити стан з Firestore
 * @returns {Object|null}
 */
export async function loadStateFromCloud() {
  const snap = await getDoc(
    doc(db, "appState", "main")
  );

  if (!snap.exists()) return null;

  return snap.data();
}