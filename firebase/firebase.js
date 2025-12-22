/**
 * 🔥 firebase.js
 * ---------------------------------------
 * Firebase init + Cloud sync for AppState
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// =======================================
// 🔐 CONFIG
// =======================================
const firebaseConfig = {
  apiKey: "AIzaSyDp_Vf7rPpGUNJROAGD-2o-fA-0Ux5VBZw",
  authDomain: "quail-farm-tracke.firebaseapp.com",
  projectId: "quail-farm-tracke",
  storageBucket: "quail-farm-tracke.firebasestorage.app",
  messagingSenderId: "914329630014",
  appId: "1:914329630014:web:ef1cce3719b6a0e1cea86f"
};

// =======================================
// 🔥 INIT (SAFE)
// =======================================
let app = null;
let db = null;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);

// =======================================
// 📌 CONSTANTS
// =======================================
const DOC_PATH = ["app", "state"];

// =======================================
// ✅ CHECK
// =======================================
export function isFirebaseReady() {
  return !!db;
}

// =======================================
// 📥 LOAD STATE (ONCE)
// =======================================
export async function loadStateFromCloud() {
  const ref = doc(db, ...DOC_PATH);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;
  return snap.data();
}

// =======================================
// 💾 SAVE STATE (MERGE)
// =======================================
export async function saveStateToCloud(state) {
  if (!state || typeof state !== "object") return;

  const ref = doc(db, ...DOC_PATH);

  // 🔴 КЛЮЧОВЕ: merge:true
  await setDoc(ref, structuredClone(state), {
    merge: true
  });
}

// =======================================
// 🔄 REALTIME SYNC
// =======================================
export function subscribeToCloudState(onUpdate) {
  const ref = doc(db, ...DOC_PATH);

  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    if (typeof onUpdate === "function") {
      onUpdate(data);
    }
  });
}