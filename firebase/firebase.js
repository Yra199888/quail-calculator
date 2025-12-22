/**
 * 🔥 firebase.js
 * ---------------------------------------
 * Firebase Cloud Firestore
 * ЄДИНЕ джерело синхронізації між пристроями
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

/* =======================================
   CONFIG
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
   INIT
   ======================================= */
let app = null;
let db = null;

export function isFirebaseReady() {
  return !!db;
}

function initFirebase() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  }
  db = getFirestore();
}

initFirebase();

/* =======================================
   PATH
   ❗ ОДИН і той самий документ для всіх
   ======================================= */
const STATE_DOC = doc(db, "app", "state");

/* =======================================
   SAVE (MERGE!)
   ======================================= */
export async function saveStateToCloud(AppState) {
  if (!db) return;

  await setDoc(
    STATE_DOC,
    {
      ...AppState,
      __updatedAt: serverTimestamp()
    },
    { merge: true } // 🔥 КЛЮЧОВЕ
  );
}

/* =======================================
   LOAD
   ======================================= */
export async function loadStateFromCloud() {
  if (!db) return null;

  const snap = await getDoc(STATE_DOC);
  if (!snap.exists()) return null;

  const data = snap.data();
  delete data.__updatedAt;

  return data;
}

/* =======================================
   REALTIME SYNC
   ======================================= */
export function subscribeToCloudState(cb) {
  if (!db) return;

  onSnapshot(STATE_DOC, (snap) => {
    if (!snap.exists()) return;

    const data = snap.data();
    delete data.__updatedAt;

    cb(data);
  });
}