/**
 * 🔥 firebase.js
 * ------------------------------------
 * ЄДИНА точка ініціалізації Firebase
 * Firestore + realtime sync
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import { AppState } from "../state/AppState.js";

// =====================================
// 🔐 CONFIG
// =====================================
const firebaseConfig = {
  apiKey: "AIzaSyDp_Vf7rPpGUNJROAGD-2o-fA-0Ux5VBZw",
  authDomain: "quail-farm-tracke.firebaseapp.com",
  projectId: "quail-farm-tracke",
  storageBucket: "quail-farm-tracke.firebasestorage.app",
  messagingSenderId: "914329630014",
  appId: "1:914329630014:web:ef1cce3719b6a0e1cea86f"
};

// =====================================
// 🚀 INIT (ВАЖЛИВО: ПОРЯДОК)
// =====================================
let app = null;
let db = null;
let ready = false;

try {
  app = initializeApp(firebaseConfig);   // ✅ 1
  db = getFirestore(app);                // ✅ 2
  ready = true;
  console.log("🔥 Firebase initialized");
} catch (err) {
  console.warn("⚠ Firebase init failed", err);
}

// =====================================
// 🧠 HELPERS
// =====================================
export function isFirebaseReady() {
  return ready;
}

function getStateRef() {
  if (!ready) throw new Error("Firebase not ready");
  return doc(db, "app", "state");
}

// =====================================
// ☁ SAVE
// =====================================
export async function saveStateToCloud() {
  if (!ready) return;

  await setDoc(
    getStateRef(),
    JSON.parse(JSON.stringify(AppState)), // без proxy
    { merge: true }
  );

  console.log("☁ AppState saved to Firebase");
}

// =====================================
// ☁ LOAD
// =====================================
export async function loadStateFromCloud() {
  if (!ready) return null;

  const snap = await getDoc(getStateRef());
  return snap.exists() ? snap.data() : null;
}

// =====================================
// 🔄 REALTIME SYNC
// =====================================
export function subscribeToCloudState(callback) {
  if (!ready) return;

  return onSnapshot(getStateRef(), (snap) => {
    if (!snap.exists()) return;
    callback(snap.data());
  });
}