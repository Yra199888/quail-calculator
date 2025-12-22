/**
 * 🔥 firebase.js — SAFE VERSION
 * ❌ НЕ перезаписує яйця
 * ✅ додає / оновлює по датах
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// ================= CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyDp_Vf7rPpGUNJROAGD-2o-fA-0Ux5VBZw",
  authDomain: "quail-farm-tracke.firebaseapp.com",
  projectId: "quail-farm-tracke",
  storageBucket: "quail-farm-tracke.firebasestorage.app",
  messagingSenderId: "914329630014",
  appId: "1:914329630014:web:ef1cce3719b6a0e1cea86f"
};

// ================= INIT =================
let app;
let db;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
}
db = getFirestore();

export function isFirebaseReady() {
  return !!db;
}

// ❗ Один документ
const STATE_REF = doc(db, "app", "state");

// ================= SAVE EGGS SAFELY =================
export async function saveEggsToCloud(eggsRecords) {
  if (!db || !eggsRecords) return;

  const payload = {};

  // 🔥 КЛЮЧОВЕ: update через dot-path
  Object.entries(eggsRecords).forEach(([date, record]) => {
    payload[`eggs.records.${date}`] = record;
  });

  await updateDoc(STATE_REF, payload);
}

// ================= LOAD =================
export async function loadStateFromCloud() {
  if (!db) return null;

  const snap = await getDoc(STATE_REF);
  if (!snap.exists()) return null;

  return snap.data();
}

// ================= REALTIME =================
export function subscribeToCloudState(cb) {
  if (!db) return;

  onSnapshot(STATE_REF, (snap) => {
    if (!snap.exists()) return;
    cb(snap.data());
  });
}